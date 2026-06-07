import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  // Delete all user data in correct order (respecting foreign keys)
  // Budget
  const { data: plans } = await supabaseAdmin
    .from("budget_plans")
    .select("id")
    .eq("user_id", userId);

  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id);
    await supabaseAdmin.from("transactions").delete().in("plan_id", planIds);
    await supabaseAdmin
      .from("budget_categories")
      .delete()
      .in("plan_id", planIds);
    await supabaseAdmin.from("budget_plans").delete().eq("user_id", userId);
  }

  await supabaseAdmin
    .from("daily_budget_config")
    .delete()
    .eq("user_id", userId);

  // Tasks
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id")
    .eq("user_id", userId);

  if (tasks && tasks.length > 0) {
    const taskIds = tasks.map((t) => t.id);
    await supabaseAdmin.from("subtasks").delete().in("task_id", taskIds);
    await supabaseAdmin.from("tasks").delete().eq("user_id", userId);
  }

  // Timer
  await supabaseAdmin.from("focus_sessions").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_stats").delete().eq("user_id", userId);
  await supabaseAdmin.from("timer_settings").delete().eq("user_id", userId);

  // Forum
  const { data: posts } = await supabaseAdmin
    .from("forum_posts")
    .select("id")
    .eq("author_id", userId);

  if (posts && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    await supabaseAdmin.from("post_upvotes").delete().in("post_id", postIds);
    await supabaseAdmin.from("post_flags").delete().in("post_id", postIds);
    await supabaseAdmin.from("forum_comments").delete().in("post_id", postIds);
    await supabaseAdmin.from("forum_posts").delete().eq("author_id", userId);
  }

  await supabaseAdmin.from("comment_upvotes").delete().eq("user_id", userId);

  await supabaseAdmin.from("forum_comments").delete().eq("author_id", userId);

  // Calendar + Settings
  await supabaseAdmin.from("calendar_settings").delete().eq("user_id", userId);

  await supabaseAdmin.from("user_settings").delete().eq("user_id", userId);

  return NextResponse.json({ success: true });
}
