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
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { duration_minutes, session_type, completed } = body;

  const today = new Date().toISOString().slice(0, 10);

  // Save the session
  const { data, error } = await supabaseAdmin
    .from("focus_sessions")
    .insert({
      user_id: userId,
      duration_minutes: Number(duration_minutes),
      session_type: session_type ?? "focus",
      completed: completed ?? false,
      date: today,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update user stats if it was a completed focus session
  if (completed && session_type === "focus") {
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const currentStreak = stats?.streak_days ?? 0;
    const lastActive = stats?.last_active_date;

    // Calculate new streak
    let newStreak = 1;
    if (lastActive === today) {
      newStreak = currentStreak;
    } else if (lastActive === yesterdayStr) {
      newStreak = currentStreak + 1;
    }

    const newLongest = Math.max(stats?.longest_streak ?? 0, newStreak);

    await supabaseAdmin.from("user_stats").upsert(
      {
        user_id: userId,
        streak_days: newStreak,
        longest_streak: newLongest,
        total_focus_minutes:
          (stats?.total_focus_minutes ?? 0) + Number(duration_minutes),
        total_sessions_completed: (stats?.total_sessions_completed ?? 0) + 1,
        last_active_date: today,
      },
      { onConflict: "user_id" },
    );
  }

  return NextResponse.json({ session: data });
}
