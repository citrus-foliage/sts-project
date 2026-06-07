import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL, resolveRecipient } from "@/lib/email/resend";
import { forumReplyEmail } from "@/lib/email/templates/forum-reply";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("forum_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check upvotes
  const commentIds = (data ?? []).map((c) => c.id);
  let upvotedIds: string[] = [];

  if (commentIds.length > 0) {
    const { data: upvotes } = await supabaseAdmin
      .from("comment_upvotes")
      .select("comment_id")
      .eq("user_id", userId)
      .in("comment_id", commentIds);
    upvotedIds = (upvotes ?? []).map((u) => u.comment_id);
  }

  // Build threaded structure
  const comments = (data ?? []).map((c) => ({
    ...c,
    user_has_upvoted: upvotedIds.includes(c.id),
    replies: [] as typeof data,
  }));

  const map: Record<string, (typeof comments)[0]> = {};
  const roots: (typeof comments)[0][] = [];

  comments.forEach((c) => {
    map[c.id] = c;
  });
  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(c);
    } else {
      roots.push(c);
    }
  });

  return NextResponse.json({ comments: roots });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { post_id, parent_id, comment_body, is_anonymous } = body;

  if (!post_id || !comment_body) {
    return NextResponse.json(
      { error: "post_id and body are required" },
      { status: 400 },
    );
  }

  const { data: codeData } = await supabaseAdmin.rpc("generate_anon_code", {
    user_email: userId,
  });

  const depth = parent_id ? 1 : 0;

  const { data, error } = await supabaseAdmin
    .from("forum_comments")
    .insert({
      post_id,
      parent_id: parent_id ?? null,
      author_id: userId,
      is_anonymous: is_anonymous ?? false,
      anon_code: codeData ?? "#0000",
      body: comment_body,
      depth,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Send forum reply notification ──
  try {
    const { data: post } = await supabaseAdmin
      .from("forum_posts")
      .select("author_id, title")
      .eq("id", post_id)
      .single();

    // Don't notify if author is replying to their own post
    if (post && post.author_id !== userId) {
      const { data: authorSettings } = await supabaseAdmin
        .from("user_settings")
        .select("notify_forum_replies, display_name")
        .eq("user_id", post.author_id)
        .single();

      if (authorSettings?.notify_forum_replies !== false) {
        const name =
          authorSettings?.display_name ?? post.author_id.split("@")[0];
        const { subject, html } = forumReplyEmail({
          name,
          postTitle: post.title,
          postId: post_id,
          commenterCode: codeData ?? "#0000",
          commentBody: comment_body,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: resolveRecipient(post.author_id),
          subject,
          html,
        });
      }
    }
  } catch {
    // Email failure should not break comment creation
  }

  return NextResponse.json({ comment: data });
}
