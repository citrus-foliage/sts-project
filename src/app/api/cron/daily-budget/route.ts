import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { dailyBudgetEmail } from "@/lib/email/templates/daily-budget";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with daily budget config
  const { data: configs } = await supabaseAdmin
    .from("daily_budget_config")
    .select("*");

  if (!configs || configs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const config of configs) {
    // Check notifications enabled
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("notify_daily_budget, display_name")
      .eq("user_id", config.user_id)
      .single();

    if (settings?.notify_daily_budget === false) continue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cycle = new Date(config.next_budget_cycle);
    cycle.setHours(0, 0, 0, 0);
    const diffMs = cycle.getTime() - today.getTime();
    const daysLeft = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
    const dailyAllowance = config.remaining_balance / daysLeft;

    const name = settings?.display_name ?? config.user_id.split("@")[0];
    const { subject, html } = dailyBudgetEmail({
      name,
      dailyAllowance,
      remainingBalance: config.remaining_balance,
      daysLeft,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: config.user_id,
      subject,
      html,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
