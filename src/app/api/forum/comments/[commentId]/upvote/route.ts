import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;
  const userId = session.user.email;

  const { data: existing } = await supabaseAdmin
    .from("comment_upvotes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("comment_upvotes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    await supabaseAdmin
      .from("forum_comments")
      .update({ upvotes: supabaseAdmin.rpc("decrement", {}) });

    const { data } = await supabaseAdmin
      .from("forum_comments")
      .select("upvotes")
      .eq("id", commentId)
      .single();

    await supabaseAdmin
      .from("forum_comments")
      .update({ upvotes: Math.max((data?.upvotes ?? 1) - 1, 0) })
      .eq("id", commentId);

    return NextResponse.json({ upvoted: false });
  } else {
    await supabaseAdmin
      .from("comment_upvotes")
      .insert({ comment_id: commentId, user_id: userId });

    const { data } = await supabaseAdmin
      .from("forum_comments")
      .select("upvotes")
      .eq("id", commentId)
      .single();

    await supabaseAdmin
      .from("forum_comments")
      .update({ upvotes: (data?.upvotes ?? 0) + 1 })
      .eq("id", commentId);

    return NextResponse.json({ upvoted: true });
  }
}
