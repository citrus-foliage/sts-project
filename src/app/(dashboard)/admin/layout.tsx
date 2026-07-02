import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", session.user.email)
    .maybeSingle();

  if (!data) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
