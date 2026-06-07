import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL, resolveRecipient } from "@/lib/email/resend";
import { budgetAlertEmail } from "@/lib/email/templates/budget-alert";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = new Date().toISOString().slice(0, 7);
  const startDate = `${month}-01`;
  const endDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  )
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", session.user.email)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { plan_id, category_id, label, amount, type, date, note } = body;

  if (!plan_id || !category_id || !label || !amount || !type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      plan_id,
      category_id,
      label,
      amount: parseFloat(amount),
      type,
      date: date ?? new Date().toISOString().slice(0, 10),
      note: note ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Send budget alert if category hits 85%+ ──
  try {
    if (type === "expense") {
      // Get all expenses for this category this month
      const { data: categoryTxns } = await supabaseAdmin
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("plan_id", plan_id)
        .eq("category_id", category_id)
        .eq("type", "expense");

      const totalSpent = (categoryTxns ?? []).reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      // Get allocation for this category
      const { data: categoryData } = await supabaseAdmin
        .from("budget_categories")
        .select("allocated, category_label")
        .eq("plan_id", plan_id)
        .eq("category_id", category_id)
        .single();

      if (categoryData && categoryData.allocated > 0) {
        const percentage = Math.round(
          (totalSpent / categoryData.allocated) * 100,
        );

        // Only alert at 85% threshold — not on every transaction
        if (percentage >= 85 && percentage < 100) {
          const { data: userSettings } = await supabaseAdmin
            .from("user_settings")
            .select("notify_budget_alerts, display_name")
            .eq("user_id", userId)
            .single();

          if (userSettings?.notify_budget_alerts !== false) {
            const name = userSettings?.display_name ?? userId.split("@")[0];
            const { subject, html } = budgetAlertEmail({
              name,
              categoryLabel: categoryData.category_label,
              spent: totalSpent,
              allocated: categoryData.allocated,
              percentage,
            });

            await resend.emails.send({
              from: FROM_EMAIL,
              to: resolveRecipient(userId),
              subject,
              html,
            });
          }
        }
      }
    }
  } catch {
    // Email failure should not break transaction creation
  }

  return NextResponse.json({ transaction: data });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing transaction id" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
