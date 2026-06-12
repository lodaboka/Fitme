// ============================================================
// Fit Me — Google Health API OAuth Callback Stub
// GET /api/health/callback
//
// This is a skeleton implementation for Google Health API
// integration. The Google Fit REST API was retired in June 2025
// and replaced by the Google Health API.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // User denied access or an error occurred
    return NextResponse.redirect(
      new URL("/settings?health_error=denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?health_error=no_code", request.url)
    );
  }

  // -------------------------------------------------------
  // STEP 1: Exchange authorization code for tokens
  // -------------------------------------------------------
  // In production, you would exchange the auth code here:
  //
  // const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: new URLSearchParams({
  //     code,
  //     client_id: process.env.GOOGLE_HEALTH_CLIENT_ID!,
  //     client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET!,
  //     redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/health/callback`,
  //     grant_type: "authorization_code",
  //   }),
  // });
  //
  // const tokens = await tokenResponse.json();
  // // tokens.access_token — short-lived token for API calls
  // // tokens.refresh_token — long-lived token to get new access tokens
  //
  // Store these tokens securely in your database (Supabase) 
  // associated with the user's profile.

  // -------------------------------------------------------
  // STEP 2: Fetch health data using the access token
  // -------------------------------------------------------
  // Use the Google Health API to fetch daily step count and
  // active calories burned:
  //
  // const healthResponse = await fetch(
  //   "https://health.googleapis.com/v4/users/me/dataSources/...",
  //   {
  //     headers: {
  //       Authorization: `Bearer ${tokens.access_token}`,
  //     },
  //   }
  // );
  //
  // The exact endpoint and data format depends on the Google
  // Health API version. Check the official docs:
  // https://developers.google.com/health

  // -------------------------------------------------------
  // STEP 3: Feed data into calorie allowance
  // -------------------------------------------------------
  // Once you have the active calories burned, you can adjust
  // the user's daily calorie allowance:
  //
  // adjustedGoal = baseGoal + activeCaloriesBurned
  //
  // This means if a user burns 300 extra calories through
  // exercise, their daily food intake goal increases by 300.

  // -------------------------------------------------------
  // NOTE: Apple HealthKit Integration
  // -------------------------------------------------------
  // Apple HealthKit does NOT have a REST API. To integrate:
  // 1. Wrap this web app in a native container (React Native,
  //    Capacitor, or Swift WebView)
  // 2. Use HealthKit native APIs to read step/calorie data
  // 3. Send data to your backend via a custom API endpoint
  // 4. This requires an Apple Developer account ($99/year)
  //    and App Store submission

  // For now, redirect back to settings with success
  return NextResponse.redirect(
    new URL("/settings?health_connected=true", request.url)
  );
}
