// ============================================================
// Fit Me v2 — Nutrition / My Meals Page (Server Component)
// Lists logged meals with meal category tabs
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NutritionClient from "./NutritionClient";

export default async function NutritionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch last 7 days of food logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: logs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", sevenDaysAgo.toISOString())
    .order("logged_at", { ascending: false });

  return <NutritionClient logs={logs || []} />;
}
