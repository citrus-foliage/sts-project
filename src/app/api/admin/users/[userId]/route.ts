import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function requireAdmin(email: string) {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", email)
    .maybeSingle();
  return data ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { action, timeout_days, ban_reason, note } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  // Prevent actioning another admin unless super_admin
  const { data: targetAdmin } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetAdmin && admin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can action other admins" },
      { status: 403 },
    );
  }

  // Prevent banning (super_admin only)
  if (
    (action === "ban" || action === "unban") &&
    admin.role !== "super_admin"
  ) {
    return NextResponse.json(
      { error: "Only super admins can ban or unban users" },
      { status: 403 },
    );
  }

  let standingUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    actioned_by: session.user.email,
  };

  if (action === "warn") {
    standingUpdate = { ...standingUpdate, status: "warned" };
  } else if (action === "timeout") {
    const days = Math.min(timeout_days ?? 1, 30); // cap at 30 days
    const until = new Date();
    until.setDate(until.getDate() + days);
    standingUpdate = {
      ...standingUpdate,
      status: "timeout",
      timeout_until: until.toISOString(),
    };
  } else if (action === "ban") {
    standingUpdate = {
      ...standingUpdate,
      status: "banned",
      ban_reason: ban_reason ?? "Violation of community guidelines",
      timeout_until: null,
    };
  } else if (action === "unban") {
    standingUpdate = {
      ...standingUpdate,
      status: "good",
      ban_reason: null,
      timeout_until: null,
    };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Upsert standing record
  const { error } = await supabaseAdmin
    .from("user_standing")
    .upsert({ user_id: userId, ...standingUpdate }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabaseAdmin.from("mod_actions").insert({
    mod_id: session.user.email,
    target_user_id: userId,
    target_post_id: null,
    action,
    note: note ?? null,
  });

  return NextResponse.json({ success: true });
}
