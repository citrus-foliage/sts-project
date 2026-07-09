import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const subscription = await req.json();

  if (!subscription?.endpoint) {
    return NextResponse.json(
      { error: "Invalid subscription object" },
      { status: 400 },
    );
  }

  // Upsert by endpoint so re-subscribing the same browser doesn't duplicate
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, subscription, endpoint: subscription.endpoint },
      { onConflict: "endpoint" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { endpoint } = await req.json();

  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint is required" },
      { status: 400 },
    );
  }

  await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
