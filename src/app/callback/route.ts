// ============================================================
// Fit Me — Auth Callback Route
// Handles email verification & OAuth redirects
// New users → /onboarding, returning users → /dashboard
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if user has completed onboarding
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      // New signup → send straight to onboarding (skip login page)
      if (!profile || !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // Returning verified user → dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}

