// ============================================================
// Fit Me — Auth Callback Route (Cross-Browser OTP Verification)
//
// Uses token_hash + verifyOtp instead of PKCE exchangeCodeForSession.
// This is STATELESS — no cookies from the original browser are needed,
// so clicking the email link in ANY browser works correctly.
//
// ⚠️  SUPABASE DASHBOARD ACTION REQUIRED:
//     Go to Authentication > Email Templates > Confirm signup
//     Change the template URL from {{ .ConfirmationURL }} to:
//     {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const origin = requestUrl.origin;

  // Also support the legacy `code` param as a graceful fallback
  const code = requestUrl.searchParams.get("code");

  const supabase = await createClient();

  // ── Primary Path: token_hash OTP verification (stateless) ──
  if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });

      if (error) {
        console.error("OTP verification error:", error.message);
        return NextResponse.redirect(
          `${origin}/login?error=auth-fallback`
        );
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

        // New signup → onboarding
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Returning user → dashboard
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }

    return NextResponse.redirect(`${origin}/login?error=auth-fallback`);
  }

  // ── Fallback Path: legacy PKCE code exchange ──────────────
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Code exchange error:", error.message);
        return NextResponse.redirect(
          `${origin}/login?error=auth-fallback`
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch (err) {
      console.error("Legacy callback error:", err);
    }
  }

  // ── No valid params → redirect to login with error ────────
  return NextResponse.redirect(`${origin}/login?error=auth-fallback`);
}
