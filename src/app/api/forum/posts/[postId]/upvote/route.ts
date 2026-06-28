import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { postId } = await params;

  // Check if this user has already upvoted this post
  const { data: existing } = await supabaseAdmin
    .from("post_upvotes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Already upvoted — remove it (toggle off)
    const { error } = await supabaseAdmin
      .from("post_upvotes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ upvoted: false });
  } else {
    // Not yet upvoted — insert (toggle on)
    const { error } = await supabaseAdmin
      .from("post_upvotes")
      .insert({ post_id: postId, user_id: userId });

    if (error) {
      // Unique constraint violation means a race condition — treat as already upvoted
      if (error.code === "23505") {
        return NextResponse.json({ upvoted: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ upvoted: true });
  }
}
