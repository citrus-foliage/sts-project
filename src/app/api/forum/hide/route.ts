import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/forum/hide — toggle hide on a post
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

  const { data: existing } = await supabaseAdmin
    .from("hidden_posts")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", post_id)
    .single();

  if (existing) {
    // Unhide
    await supabaseAdmin
      .from("hidden_posts")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", post_id);
    return NextResponse.json({ hidden: false });
  } else {
    // Hide
    await supabaseAdmin
      .from("hidden_posts")
      .insert({ user_id: userId, post_id });
    return NextResponse.json({ hidden: true });
  }
}

// GET /api/forum/hide — get all hidden post ids for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const { data, error } = await supabaseAdmin
    .from("hidden_posts")
    .select(
      `
      post_id,
      hidden_at,
      forum_posts (
        id, title, body, flair, is_anonymous, anon_code,
        upvotes, flag_count, status, created_at, image_url
      )
    `,
    )
    .eq("user_id", userId)
    .order("hidden_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hidden: data ?? [] });
}
