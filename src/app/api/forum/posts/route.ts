import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "new";
  const flair = searchParams.get("flair");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const search = searchParams.get("search");
  let query = supabaseAdmin
    .from("forum_posts")
    .select("*, forum_comments(count)", { count: "exact" })
    .neq("status", "removed")
    .range(offset, offset + limit - 1);
  if (flair) query = query.eq("flair", flair);
  if (search && search.trim().length > 0) {
    query = query.or(
      `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`,
    );
  }

  if (sort === "top") {
    query = query.order("upvotes", { ascending: false });
  } else if (sort === "hot") {
    query = query
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check which posts user has upvoted
  const postIds = (data ?? []).map((p) => p.id);
  let upvotedIds: string[] = [];

  if (postIds.length > 0) {
    const { data: upvotes } = await supabaseAdmin
      .from("post_upvotes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);
    upvotedIds = (upvotes ?? []).map((u) => u.post_id);
  }

  const posts = (data ?? []).map((post) => ({
    ...post,
    comment_count: post.forum_comments?.[0]?.count ?? 0,
    user_has_upvoted: upvotedIds.includes(post.id),
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { title, post_body, flair, is_anonymous } = body;

  if (!title || !post_body || !flair) {
    return NextResponse.json(
      { error: "Title, body and flair are required" },
      { status: 400 },
    );
  }

  // Generate anon code using the SQL function
  const { data: codeData } = await supabaseAdmin.rpc("generate_anon_code", {
    user_email: userId,
  });

  const anonCode = codeData ?? "#0000";

  const { data, error } = await supabaseAdmin
    .from("forum_posts")
    .insert({
      author_id: userId,
      is_anonymous: is_anonymous ?? true,
      anon_code: anonCode,
      flair,
      title,
      body: post_body,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
