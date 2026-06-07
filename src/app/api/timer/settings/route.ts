import { NextRequest, NextResponse } from "next/server";
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
    .from("timer_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return defaults if no settings exist yet
  return NextResponse.json({
    settings: data ?? {
      focus_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      sessions_before_long_break: 4,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const {
    focus_duration,
    short_break_duration,
    long_break_duration,
    sessions_before_long_break,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("timer_settings")
    .upsert(
      {
        user_id: userId,
        focus_duration: Number(focus_duration),
        short_break_duration: Number(short_break_duration),
        long_break_duration: Number(long_break_duration),
        sessions_before_long_break: Number(sessions_before_long_break),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
