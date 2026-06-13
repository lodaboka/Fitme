// ============================================================
// Fit Me — Dashboard AI Insight Route (3-Tier Failover)
// GET /api/analytics/insight
//
// Architecture:
//   Tier 1 → GitHub Models (GPT-4o)
//   Tier 2 → Google AI Studio (Gemini 2.0 Flash)
//   Tier 3 → Groq Cloud (Llama 3.2)
//
// Returns a single snappy coaching sentence for the dashboard
// chat bubble. Designed to be called once per day and cached.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const INSIGHT_PROMPT = `You are a friendly, expert Indian nutritionist AI coach for a calorie tracking app called FitMe.

You will receive a user's nutrition summary for the last 3 days, along with their daily goals.

Generate a SHORT (1-2 sentences max), snappy, personalized coaching message. Be specific to Indian cuisine when suggesting foods.

RULES:
- Maximum 25 words
- Be motivational and specific
- Reference numbers from the data
- Suggest specific Indian foods when relevant (paneer, dal, roti, dosa, idli, poha, etc.)
- Use 1 relevant emoji at the end
- Do NOT use markdown formatting
- Do NOT mention you are an AI
- Speak directly to the user ("You", "Your")

Return ONLY the insight text, nothing else.`;

// ── Provider helpers (same structure as /api/snap) ───────────

async function callGPT4o(userContent: string): Promise<string> {
  const token = process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_MODELS_TOKEN not configured");

  const res = await fetch(
    "https://models.inference.ai.azure.com/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: INSIGHT_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 80,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GPT-4o ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGemini(userContent: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");

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
            parts: [{ text: userContent }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 80,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function callGroq(userContent: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          { role: "system", content: INSIGHT_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 80,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ── 3-Tier Provider Cascade ─────────────────────────────────
interface InsightProvider {
  name: string;
  call: (content: string) => Promise<string>;
}

const PROVIDERS: InsightProvider[] = [
  { name: "GPT-4o", call: callGPT4o },
  { name: "Gemini 2.0 Flash", call: callGemini },
  { name: "Groq (Llama 3.2)", call: callGroq },
];

// ── Rule-based fallback ─────────────────────────────────────
function generateFallback(
  dayMap: Record<string, { calories: number; protein: number }>,
  profile: { daily_calories_goal: number; daily_protein_goal: number }
): string {
  const days = Object.values(dayMap);
  if (days.length === 0) return "Snap your first meal to get AI coaching! 📸";

  const avgCals = Math.round(
    days.reduce((s, d) => s + d.calories, 0) / days.length
  );
  const avgProtein = Math.round(
    days.reduce((s, d) => s + d.protein, 0) / days.length
  );
  const proteinGap =
    ((profile.daily_protein_goal - avgProtein) / profile.daily_protein_goal) *
    100;

  if (proteinGap > 20) {
    return `Protein is ${Math.round(proteinGap)}% low — try adding paneer or dal 🥚`;
  }
  if (avgCals > profile.daily_calories_goal * 1.15) {
    return `You're over your calorie goal — lighter portions today! 🥗`;
  }
  return `Averaging ${avgCals} kcal/day — on track! Keep it up ✨`;
}

// ── GET Handler ─────────────────────────────────────────────
export async function GET() {
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
      .select(
        "daily_calories_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal, goal, current_weight_kg, target_weight_kg"
      )
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { insight: "Complete your profile for AI coaching! 📝" },
        { status: 200 }
      );
    }

    // Fetch last 3 days of logs
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: logs } = await supabase
      .from("food_logs")
      .select(
        "total_calories, total_protein, total_carbs, total_fats, logged_at"
      )
      .eq("user_id", user.id)
      .gte("logged_at", threeDaysAgo.toISOString())
      .order("logged_at", { ascending: true });

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        {
          insight:
            "Snap your first meal to get personalized AI coaching! 📸",
        },
        { status: 200 }
      );
    }

    // Aggregate by day
    const dayMap: Record<
      string,
      { calories: number; protein: number; carbs: number; fats: number; meals: number }
    > = {};
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

    // Build context for AI
    const daySummaries = Object.entries(dayMap)
      .map(
        ([date, data]) =>
          `${date}: ${Math.round(data.calories)} kcal, ${Math.round(data.protein)}g protein, ${Math.round(data.carbs)}g carbs, ${Math.round(data.fats)}g fats (${data.meals} meals)`
      )
      .join("\n");

    const userContent = `USER GOALS:
- Daily calories: ${profile.daily_calories_goal} kcal
- Daily protein: ${profile.daily_protein_goal}g
- Daily carbs: ${profile.daily_carbs_goal}g
- Daily fats: ${profile.daily_fat_goal}g
- Goal: ${profile.goal === "lose" ? "Weight loss" : profile.goal === "gain" ? "Weight gain" : "Maintenance"}

LAST 3 DAYS DATA:
${daySummaries}`;

    // ── 3-Tier Failover Loop ──────────────────────────────
    let insightText = "";
    const errors: string[] = [];

    for (const provider of PROVIDERS) {
      try {
        console.log(`[Insight] Trying ${provider.name}...`);
        insightText = await provider.call(userContent);
        if (insightText) {
          console.log(`[Insight] ✓ ${provider.name} succeeded`);
          break;
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown provider error";
        errors.push(`${provider.name}: ${msg}`);
        console.warn(`[Insight] ✗ ${provider.name} failed:`, msg);
      }
    }

    // Rule-based fallback if all AI models fail
    if (!insightText) {
      console.warn("[Insight] All providers failed, using fallback:", errors);
      insightText = generateFallback(dayMap, profile);
    }

    return NextResponse.json({ insight: insightText }, { status: 200 });
  } catch (err) {
    console.error("Insight generation error:", err);
    return NextResponse.json(
      { insight: "Keep tracking your meals for AI insights! 💪" },
      { status: 200 }
    );
  }
}
