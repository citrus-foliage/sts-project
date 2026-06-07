import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { post_id, reason } = body;

  if (!post_id) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  // Check if already flagged
  const { data: existing } = await supabaseAdmin
    .from("post_flags")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already flagged this post" },
      { status: 400 },
    );
  }

  await supabaseAdmin
    .from("post_flags")
    .insert({ post_id, user_id: userId, reason: reason ?? null });

  // Get current flag count
  const { data: post } = await supabaseAdmin
    .from("forum_posts")
    .select("flag_count")
    .eq("id", post_id)
    .single();

  const newFlagCount = (post?.flag_count ?? 0) + 1;

  // Auto-hide if 5+ flags
  await supabaseAdmin
    .from("forum_posts")
    .update({
      flag_count: newFlagCount,
      status: newFlagCount >= 5 ? "pending_review" : "active",
    })
    .eq("id", post_id);

  return NextResponse.json({ flagged: true, flag_count: newFlagCount });
}
