import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { taskReminderEmail } from "@/lib/email/templates/task-reminder";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Get all tasks due tomorrow
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("user_id, title, due_date, priority")
    .eq("due_date", tomorrowStr)
    .neq("status", "completed");

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user
  const byUser = tasks.reduce(
    (acc, task) => {
      if (!acc[task.user_id]) acc[task.user_id] = [];
      acc[task.user_id].push(task);
      return acc;
    },
    {} as Record<string, typeof tasks>,
  );

  let sent = 0;

  for (const [userId, userTasks] of Object.entries(byUser)) {
    // Check if user has notifications enabled
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("notify_task_reminders, display_name")
      .eq("user_id", userId)
      .single();

    if (settings?.notify_task_reminders === false) continue;

    const name = settings?.display_name ?? userId.split("@")[0];
    const { subject, html } = taskReminderEmail({ name, tasks: userTasks });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userId,
      subject,
      html,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
