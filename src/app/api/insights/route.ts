// ============================================================
// Fit Me — AI Insights API Route
// POST /api/insights
//
// Calls Gemini 2.0 Flash with last 3 days of nutrition data
// to generate a personalized, natural-language insight.
// Designed to be called ONCE per day and cached client-side.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const INSIGHT_PROMPT = `You are a friendly, expert Indian nutritionist AI assistant for a calorie tracking app called FitMe.

You will receive a user's nutrition summary for the last 3 days, along with their daily goals.

Generate a SHORT (2-3 sentences max), personalized, actionable insight. Be specific to Indian cuisine when suggesting foods.

RULES:
- Keep it concise and motivational
- Reference specific numbers from the data
- Suggest specific Indian foods when relevant (paneer, dal, roti, dosa, idli, poha, etc.)
- Use 1 relevant emoji at the end
- Do NOT use markdown formatting
- Do NOT mention you are an AI
- Speak directly to the user ("You", "Your")

Return ONLY the insight text, nothing else.`;

export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch profile goals
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_calories_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal, goal, current_weight_kg, target_weight_kg")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { insight: "Complete your profile to get personalized insights! 📝" },
        { status: 200 }
      );
    }

    // Fetch last 3 days of logs
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: logs } = await supabase
      .from("food_logs")
      .select("total_calories, total_protein, total_carbs, total_fats, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", threeDaysAgo.toISOString())
      .order("logged_at", { ascending: true });

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { insight: "Start logging meals to get personalized AI insights! Snap a photo of your next meal 📸" },
        { status: 200 }
      );
    }

    // Aggregate by day
    const dayMap: Record<string, { calories: number; protein: number; carbs: number; fats: number; meals: number }> = {};
    for (const log of logs) {
      const day = new Date(log.logged_at).toISOString().split("T")[0];
      if (!dayMap[day]) {
        dayMap[day] = { calories: 0, protein: 0, carbs: 0, fats: 0, meals: 0 };
      }
      dayMap[day].calories += log.total_calories || 0;
      dayMap[day].protein += log.total_protein || 0;
      dayMap[day].carbs += log.total_carbs || 0;
      dayMap[day].fats += log.total_fats || 0;
      dayMap[day].meals += 1;
    }

    // Build the data summary for Gemini
    const daySummaries = Object.entries(dayMap)
      .map(([date, data]) => `${date}: ${Math.round(data.calories)} kcal, ${Math.round(data.protein)}g protein, ${Math.round(data.carbs)}g carbs, ${Math.round(data.fats)}g fats (${data.meals} meals)`)
      .join("\n");

    const userContext = `USER GOALS:
- Daily calories: ${profile.daily_calories_goal} kcal
- Daily protein: ${profile.daily_protein_goal}g
- Daily carbs: ${profile.daily_carbs_goal}g
- Daily fats: ${profile.daily_fat_goal}g
- Goal: ${profile.goal === "lose" ? "Weight loss" : profile.goal === "gain" ? "Weight gain" : "Maintenance"}
- Current weight: ${profile.current_weight_kg || "Unknown"} kg
- Target weight: ${profile.target_weight_kg || "Unknown"} kg

LAST 3 DAYS DATA:
${daySummaries}`;

    // Call Gemini 2.0 Flash
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Fallback to rule-based if no key
      return NextResponse.json(
        { insight: generateFallbackInsight(dayMap, profile) },
        { status: 200 }
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: INSIGHT_PROMPT }],
          },
          contents: [
            {
              parts: [{ text: userContext }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn("Gemini insight call failed, using fallback");
      return NextResponse.json(
        { insight: generateFallbackInsight(dayMap, profile) },
        { status: 200 }
      );
    }

    const data = await res.json();
    const insightText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!insightText) {
      return NextResponse.json(
        { insight: generateFallbackInsight(dayMap, profile) },
        { status: 200 }
      );
    }

    return NextResponse.json({ insight: insightText }, { status: 200 });
  } catch (err) {
    console.error("Insight generation error:", err);
    return NextResponse.json(
      { insight: "Keep tracking your meals for personalized insights! 💪" },
      { status: 200 }
    );
  }
}

// Fallback rule-based insight if Gemini is unavailable
function generateFallbackInsight(
  dayMap: Record<string, { calories: number; protein: number; carbs: number; fats: number; meals: number }>,
  profile: { daily_calories_goal: number; daily_protein_goal: number }
): string {
  const days = Object.values(dayMap);
  if (days.length === 0) return "Start logging meals to get insights! 📸";

  const avgCals = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length);
  const avgProtein = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length);

  const calGap = ((profile.daily_calories_goal - avgCals) / profile.daily_calories_goal) * 100;
  const proteinGap = ((profile.daily_protein_goal - avgProtein) / profile.daily_protein_goal) * 100;

  if (proteinGap > 20) {
    return `Your protein is ${Math.round(proteinGap)}% below target (avg ${avgProtein}g/day). Try adding paneer, eggs, or dal to your meals 🥚`;
  }
  if (calGap < -15) {
    return `You're exceeding your calorie goal by ${Math.round(Math.abs(calGap))}% (avg ${avgCals} kcal). Consider lighter portions 🥗`;
  }
  return `You're averaging ${avgCals} kcal/day — on track with your ${profile.daily_calories_goal} kcal goal. Keep it up! ✨`;
}
