import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabaseAdmin
    .from("user_settings")
    .update({ onboarding_complete: true })
    .eq("user_id", session.user.email);

  return NextResponse.json({ ok: true });
}
