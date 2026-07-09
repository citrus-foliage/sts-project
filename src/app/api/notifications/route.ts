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

  // Fetch notifications for this user (personal) + broadcasts (user_id IS NULL)
  const { data: notifications, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch which ones this user has already read
  const notifIds = (notifications ?? []).map((n) => n.id);
  let readIds: string[] = [];

  if (notifIds.length > 0) {
    const { data: reads } = await supabaseAdmin
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", userId)
      .in("notification_id", notifIds);
    readIds = (reads ?? []).map((r) => r.notification_id);
  }

  const items = (notifications ?? []).map((n) => ({
    ...n,
    read: readIds.includes(n.id),
  }));

  const unreadCount = items.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: items, unreadCount });
}

export async function PATCH() {
  // Mark all notifications as read for this user
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  // Fetch all unread notification ids for this user
  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .or(`user_id.eq.${userId},user_id.is.null`);

  const notifIds = (notifications ?? []).map((n) => n.id);
  if (notifIds.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // Get already-read ids to avoid duplicate inserts
  const { data: existing } = await supabaseAdmin
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId)
    .in("notification_id", notifIds);

  const alreadyRead = new Set((existing ?? []).map((r) => r.notification_id));
  const toInsert = notifIds
    .filter((id) => !alreadyRead.has(id))
    .map((id) => ({ notification_id: id, user_id: userId }));

  if (toInsert.length > 0) {
    await supabaseAdmin.from("notification_reads").insert(toInsert);
  }

  return NextResponse.json({ ok: true });
}
