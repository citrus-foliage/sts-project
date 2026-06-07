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
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return defaults if no settings exist yet
  return NextResponse.json({
    settings: data ?? {
      display_name: session.user.name ?? "",
      notify_task_reminders: true,
      notify_budget_alerts: true,
      notify_daily_budget: true,
      notify_forum_replies: true,
      forum_default_anonymous: true,
      forum_show_display_name: false,
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
    display_name,
    notify_task_reminders,
    notify_budget_alerts,
    notify_daily_budget,
    notify_forum_replies,
    forum_default_anonymous,
    forum_show_display_name,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        display_name,
        notify_task_reminders,
        notify_budget_alerts,
        notify_daily_budget,
        notify_forum_replies,
        forum_default_anonymous,
        forum_show_display_name,
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
