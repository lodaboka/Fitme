// ============================================================
// Fit Me v2 — Dashboard Page (Server Component)
// Fetches user profile and today's food logs
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  // Fetch last 7 days of food logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: logs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", sevenDaysAgo.toISOString())
    .order("logged_at", { ascending: false });

  return (
    <DashboardClient
      profile={profile}
      allLogs={logs || []}
    />
  );
}
