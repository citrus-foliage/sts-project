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

  const { data: post, error } = await supabaseAdmin
    .from("forum_posts")
    .select("*")
    .eq("id", postId)
    .neq("status", "removed")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if user has upvoted
  const { data: upvote } = await supabaseAdmin
    .from("post_upvotes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  return NextResponse.json({
    post: {
      ...post,
      user_has_upvoted: !!upvote,
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
