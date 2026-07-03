import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  // Current and last month as YYYY-MM strings
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const lastMonthLabel = lastMonthDate.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  // Guard: don't create if current month plan already exists
  const { data: existing } = await supabaseAdmin
    .from("budget_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ skipped: true, reason: "Plan already exists" });
  }

  // Find last month's plan with categories and transactions
  const { data: lastPlan } = await supabaseAdmin
    .from("budget_plans")
    .select("*, budget_categories(*), transactions(*)")
    .eq("user_id", userId)
    .eq("month", lastMonth)
    .maybeSingle();

  if (!lastPlan) {
    // No previous plan to carry over from — signal the page to show setup
    return NextResponse.json({ skipped: true, reason: "No previous plan" });
  }

  // Calculate last month's balance
  const txns = (lastPlan.transactions ?? []) as {
    type: string;
    amount: number;
    category_id: string;
  }[];

  const totalSpent = txns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Effective budget = base budget + any income logged (like prior rollovers)
  const effectiveBudget = lastPlan.total_budget + totalIncome;
  const unspent = effectiveBudget - totalSpent;
  const overspent = unspent < 0;
  const rolloverAmount = overspent ? 0 : Math.round(unspent * 100) / 100;

  // Create new plan with same total_budget and allowance_date
  const { data: newPlan, error: planError } = await supabaseAdmin
    .from("budget_plans")
    .insert({
      user_id: userId,
      month: currentMonth,
      total_budget: lastPlan.total_budget,
      allowance_date: lastPlan.allowance_date,
    })
    .select()
    .single();

  if (planError || !newPlan) {
    return NextResponse.json(
      { error: planError?.message ?? "Failed to create plan" },
      { status: 500 },
    );
  }

  // Copy categories from last month
  const lastCategories = (lastPlan.budget_categories ?? []) as {
    category_id: string;
    category_label: string;
    allocated: number;
    color: string;
  }[];

  if (lastCategories.length > 0) {
    const categoryRows = lastCategories.map((cat) => ({
      plan_id: newPlan.id,
      user_id: userId,
      category_id: cat.category_id,
      category_label: cat.category_label,
      allocated: cat.allocated,
      color: cat.color,
    }));

    const { error: catError } = await supabaseAdmin
      .from("budget_categories")
      .insert(categoryRows);

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }
  }

  // Insert rollover income transaction if there's unspent balance
  if (rolloverAmount > 0) {
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      plan_id: newPlan.id,
      category_id: "rollover",
      label: `Carried over from ${lastMonthLabel}`,
      amount: rolloverAmount,
      type: "income",
      is_rollover: true,
      date: new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10),
      note: `Unspent balance from ${lastMonthLabel}`,
    });
  }

  return NextResponse.json({
    success: true,
    carried_over: rolloverAmount,
    overspent,
    overspent_amount: overspent ? Math.abs(unspent) : 0,
    last_month_label: lastMonthLabel,
    new_plan_id: newPlan.id,
  });
}
