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
  const search = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";

  // Get all users who have posted or have a standing record
  const { data: settings } = await supabaseAdmin
    .from("user_settings")
    .select("user_id, display_name, created_at");

  if (!settings) {
    return NextResponse.json({ users: [] });
  }

  // Get standing for all users
  const userIds = settings.map((s) => s.user_id);
  const { data: standings } = await supabaseAdmin
    .from("user_standing")
    .select("*")
    .in("user_id", userIds);

  const standingMap: Record<
    string,
    typeof standings extends (infer T)[] | null ? T : never
  > = {};
  (standings ?? []).forEach((s) => {
    standingMap[s.user_id] = s;
  });

  // Get post counts per user
  const { data: postCounts } = await supabaseAdmin
    .from("forum_posts")
    .select("author_id")
    .in("author_id", userIds);

  const postCountMap: Record<string, number> = {};
  (postCounts ?? []).forEach((p) => {
    postCountMap[p.author_id] = (postCountMap[p.author_id] ?? 0) + 1;
  });

  // Get admin roles
  const { data: admins } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, role");
  const adminMap: Record<string, string> = {};
  (admins ?? []).forEach((a) => {
    adminMap[a.user_id] = a.role;
  });

  let users = settings.map((s) => ({
    user_id: s.user_id,
    display_name: s.display_name ?? null,
    created_at: s.created_at,
    post_count: postCountMap[s.user_id] ?? 0,
    admin_role: adminMap[s.user_id] ?? null,
    standing: standingMap[s.user_id] ?? {
      status: "good",
      timeout_until: null,
      ban_reason: null,
    },
  }));

  // Filter by search
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q),
    );
  }

  // Filter by standing status
  if (statusFilter !== "all") {
    users = users.filter((u) => u.standing.status === statusFilter);
  }

  // Sort: banned first, then timeout, then warned, then good
  const order = { banned: 0, timeout: 1, warned: 2, good: 3 };
  users.sort(
    (a, b) =>
      (order[a.standing.status as keyof typeof order] ?? 3) -
      (order[b.standing.status as keyof typeof order] ?? 3),
  );

  return NextResponse.json({ users });
}
