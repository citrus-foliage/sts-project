import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { id } = await params;

  await supabaseAdmin
    .from("notification_reads")
    .upsert(
      { notification_id: id, user_id: userId },
      { onConflict: "notification_id,user_id", ignoreDuplicates: true },
    );

  return NextResponse.json({ ok: true });
}
