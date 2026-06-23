import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/forum/save — toggle save on a post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { post_id } = body;

  if (!post_id) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  // Check if already saved
  const { data: existing } = await supabaseAdmin
    .from("saved_posts")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", post_id)
    .single();

  if (existing) {
    // Unsave
    await supabaseAdmin
      .from("saved_posts")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", post_id);
    return NextResponse.json({ saved: false });
  } else {
    // Save
    await supabaseAdmin
      .from("saved_posts")
      .insert({ user_id: userId, post_id });
    return NextResponse.json({ saved: true });
  }
}

// GET /api/forum/save — get all saved post ids for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const { data, error } = await supabaseAdmin
    .from("saved_posts")
    .select(
      `
      post_id,
      saved_at,
      forum_posts (
        id, title, body, flair, is_anonymous, anon_code,
        upvotes, flag_count, status, created_at, image_url
      )
    `,
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data ?? [] });
}
