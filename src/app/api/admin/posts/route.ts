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
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 25;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("forum_posts")
    .select("*, forum_comments(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") query = query.eq("status", status);
  if (search.trim()) {
    query = query.or(
      `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%,author_id.ilike.%${search.trim()}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch display names for all authors
  const authorIds = [...new Set((data ?? []).map((p) => p.author_id))];
  const displayNameMap: Record<string, string | null> = {};

  if (authorIds.length > 0) {
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, display_name")
      .in("user_id", authorIds);

    (settings ?? []).forEach((s) => {
      displayNameMap[s.user_id] = s.display_name ?? null;
    });
  }

  // Fetch standing for all authors
  const standingMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: standings } = await supabaseAdmin
      .from("user_standing")
      .select("user_id, status")
      .in("user_id", authorIds);
    (standings ?? []).forEach((s) => {
      standingMap[s.user_id] = s.status;
    });
  }

  const posts = (data ?? []).map((post) => ({
    ...post,
    comment_count: post.forum_comments?.[0]?.count ?? 0,
    // Admin always sees real identity
    real_author_id: post.author_id,
    author_display_name: displayNameMap[post.author_id] ?? null,
    author_standing: standingMap[post.author_id] ?? "good",
  }));

  return NextResponse.json({ posts, total: count ?? 0 });
}
