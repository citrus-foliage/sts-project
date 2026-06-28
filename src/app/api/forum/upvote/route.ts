import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const { data, error } = await supabaseAdmin
    .from("post_upvotes")
    .select(
      `
      post_id,
      voted_at:created_at,
      forum_posts (
        id,
        title,
        body,
        flair,
        upvotes,
        created_at
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ upvoted: data ?? [] });
}
