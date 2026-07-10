import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import OnboardingWrapper from "@/components/layout/OnboardingWrapper";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Check if user has completed onboarding
  const { data: settings } = await supabaseAdmin
    .from("user_settings")
    .select("onboarding_complete")
    .eq("user_id", session.user?.email ?? "")
    .maybeSingle();

  const showOnboarding = !settings?.onboarding_complete;

  return (
    <SettingsProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "#f5f4f0" }}
      >
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-5">{children}</main>
        </div>
        {/* Onboarding tour — shown once on first login */}
        {showOnboarding && <OnboardingWrapper />}
      </div>
    </SettingsProvider>
  );
}
