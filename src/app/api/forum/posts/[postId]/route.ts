import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const userId = session.user.email;

  // Note: intentionally no .neq("status", "removed") filter here —
  // removed posts still have an accessible detail page showing a tombstone,
  // consistent with Reddit's behaviour. The public feed filters them out.
  const { data: post, error } = await supabaseAdmin
    .from("forum_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if user has upvoted
  const { data: upvote } = await supabaseAdmin
    .from("post_upvotes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  // Fetch author display name if the post is non-anonymous
  let author_display_name: string | null = null;
  if (!post.is_anonymous) {
    const { data: authorSettings } = await supabaseAdmin
      .from("user_settings")
      .select("display_name, forum_show_display_name")
      .eq("user_id", post.author_id)
      .maybeSingle();

    if (authorSettings?.forum_show_display_name) {
      author_display_name =
        authorSettings.display_name ?? post.author_id.split("@")[0];
    }
  }

  return NextResponse.json({
    post: {
      ...post,
      user_has_upvoted: !!upvote,
      author_display_name,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const userId = session.user.email;

  const { error } = await supabaseAdmin
    .from("forum_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
