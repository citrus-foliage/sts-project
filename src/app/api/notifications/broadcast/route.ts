import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPushBroadcast } from "@/lib/push";

async function requireAdmin(email: string) {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", email)
    .maybeSingle();
  return data ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, body: notifBody, link } = body;

  if (!title || !notifBody) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: null, // null = broadcast to all
      type: "announcement",
      title,
      body: notifBody,
      link: link ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send push to all subscribed users
  try {
    await sendPushBroadcast({
      title,
      body: notifBody,
      link: link ?? "/dashboard",
    });
  } catch {
    // Push failure should not block the response
  }

  return NextResponse.json({ notification: data });
}
