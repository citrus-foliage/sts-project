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
  const month = new Date().toISOString().slice(0, 7);

  const { data, error } = await supabaseAdmin
    .from("budget_plans")
    .select(
      `
      *,
      budget_categories(*),
      transactions(*)
    `,
    )
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan: data ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const body = await req.json();
  const { total_budget, allowance_date, categories } = body;
  const month = new Date().toISOString().slice(0, 7);

  // Create or update the plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from("budget_plans")
    .upsert(
      {
        user_id: userId,
        month,
        total_budget,
        allowance_date,
      },
      { onConflict: "user_id,month" },
    )
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // Insert categories if provided
  if (categories && categories.length > 0) {
    const categoryRows = categories.map(
      (cat: {
        category_id: string;
        category_label: string;
        allocated: number;
        color: string;
      }) => ({
        plan_id: plan.id,
        user_id: userId,
        category_id: cat.category_id,
        category_label: cat.category_label,
        allocated: cat.allocated,
        color: cat.color,
      }),
    );

    const { error: catError } = await supabaseAdmin
      .from("budget_categories")
      .upsert(categoryRows, { onConflict: "plan_id,category_id" });

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ plan });
}
