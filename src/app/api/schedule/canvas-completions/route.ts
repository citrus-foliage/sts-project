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

  const { data, error } = await supabaseAdmin
    .from("canvas_completions")
    .select("canvas_event_uid")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    completedUids: data.map((r) => r.canvas_event_uid),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { uid } = body;

  if (!uid || typeof uid !== "string") {
    return NextResponse.json({ error: "uid is required" }, { status: 400 });
  }

  // Check if already completed — toggle it off if so
  const { data: existing } = await supabaseAdmin
    .from("canvas_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("canvas_event_uid", uid)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("canvas_completions")
      .delete()
      .eq("user_id", userId)
      .eq("canvas_event_uid", uid);
  } else {
    await supabaseAdmin
      .from("canvas_completions")
      .insert({ user_id: userId, canvas_event_uid: uid });
  }

  return NextResponse.json({ ok: true });
}
