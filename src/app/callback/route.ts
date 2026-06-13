// ============================================================
// Fit Me — Auth Callback Route (Server-Side, Cookie-Based)
// Handles email verification & OAuth redirects using cookies
// so PKCE works across browsers (Safari signup → Chrome click)
// New users → /onboarding, returning users → /dashboard
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();

      // Exchange auth code for session — server-side using cookies
      // This fixes the PKCE cross-browser bug because the code_verifier
      // is stored in cookies (not localStorage), so it works even if
      // the user opens the confirmation link in a different browser.
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth exchange error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }

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

        // Returning verified user → dashboard
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch (err) {
      console.error("Callback route error:", err);
    }
  }

  // Fallback: no code or error → dashboard (or login if no session)
  return NextResponse.redirect(`${origin}/dashboard`);
}
