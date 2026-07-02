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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 30;
  const offset = (page - 1) * limit;
  const actionFilter = searchParams.get("action") ?? "all";

  let query = supabaseAdmin
    .from("mod_actions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (actionFilter !== "all") {
    query = query.eq("action", actionFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch display names for mods and targets
  const userIds = [
    ...new Set([
      ...(data ?? []).map((l) => l.mod_id),
      ...(data ?? [])
        .filter((l) => l.target_user_id)
        .map((l) => l.target_user_id),
    ]),
  ];

  const displayNameMap: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, display_name")
      .in("user_id", userIds);
    (settings ?? []).forEach((s) => {
      displayNameMap[s.user_id] = s.display_name ?? null;
    });
  }

  const logs = (data ?? []).map((log) => ({
    ...log,
    mod_display_name: displayNameMap[log.mod_id] ?? null,
    target_display_name: log.target_user_id
      ? (displayNameMap[log.target_user_id] ?? null)
      : null,
  }));

  return NextResponse.json({ logs, total: count ?? 0 });
}
