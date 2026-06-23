import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/settings/muted-words
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_settings")
    .select("muted_words")
    .eq("user_id", session.user.email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ muted_words: data?.muted_words ?? [] });
}

// POST /api/settings/muted-words — replace full list
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { muted_words } = body;

  if (!Array.isArray(muted_words)) {
    return NextResponse.json(
      { error: "muted_words must be an array" },
      { status: 400 },
    );
  }

  // Sanitise: lowercase, trim, deduplicate, max 50 words
  const cleaned = [
    ...new Set(
      muted_words
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0),
    ),
  ].slice(0, 50);

  const { error } = await supabaseAdmin
    .from("user_settings")
    .upsert(
      { user_id: userId, muted_words: cleaned },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ muted_words: cleaned });
}
