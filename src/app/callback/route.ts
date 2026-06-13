// ============================================================
// Fit Me — Legacy Callback Route (Catches Supabase default URL)
//
// Supabase generates confirmation emails with {{ .ConfirmationURL }}
// which resolves to /callback?token_hash=...&type=email by default.
// This route catches that default URL and processes OTP verification
// identically to /auth/callback.
//
// Supports both:
//   • token_hash + type (stateless OTP — works cross-browser)
//   • code (legacy PKCE exchange — same-browser fallback)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  const supabase = await createClient();

  // ── Primary Path: token_hash OTP verification (stateless) ──
  if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (error) {
        console.error("[callback] OTP verification error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
      }

      return await redirectBasedOnProfile(supabase, origin);
    } catch (err) {
      console.error("[callback] Auth callback error:", err);
      return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
    }
  }

  // ── Fallback Path: legacy PKCE code exchange ──────────────
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[callback] Code exchange error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
      }

      return await redirectBasedOnProfile(supabase, origin);
    } catch (err) {
      console.error("[callback] Legacy callback error:", err);
    }
  }

  // ── No valid params → login with error ────────────────────
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}

// ── Helper: redirect to onboarding or dashboard ─────────────
async function redirectBasedOnProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string
) {
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

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
