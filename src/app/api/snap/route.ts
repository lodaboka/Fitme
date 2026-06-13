// ============================================================
// Fit Me — Snap API Route (Triple-Tier AI Failover Pipeline)
// POST /api/snap
//
// Architecture:
//   Tier 1 → GitHub Models (GPT-4o)
//   Tier 2 → Google AI Studio (Gemini 2.0 Flash)
//   Tier 3 → Groq Cloud (Llama 3.2 11B Vision)
//
// Each provider uses the identical Indian-cuisine system prompt.
// A standardized normalizer guarantees DB-safe output shape
// regardless of which model responds.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────
type MealCategory =
  | "Breakfast"
  | "Morning Snack"
  | "Lunch"
  | "Evening Snack"
  | "Dinner";

interface DetectedItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

interface ParsedNutrition {
  dish_name: string;
  calories: number;
  macros: { protein_g: number; fats_g: number; carbs_g: number };
  micros: { fiber_g: number; sugar_g: number; sodium_mg: number };
  confidence_score: number;
  detected_items: DetectedItem[];
}

interface VisionProvider {
  name: string;
  call: (base64: string, mime: string) => Promise<string>;
}

// ── Shared System Prompt ─────────────────────────────────────
const VISION_SYSTEM_PROMPT = `You are a master dietitian specialized in South Asian and Indian cuisine.
Analyze the uploaded food image with extreme precision. You MUST:
1. Identify EVERY individual food item visible (e.g., roti, dal, rice, sabzi, chutney).
2. COUNT exact quantities — if you see 2 rotis, report quantity as "2", NOT "1 serving". If you see a bowl of dal, report "1 bowl".
3. Calculate per-item nutrition based on the detected quantity.
4. Account for invisible culinary elements typical to Indian preparations (ghee, oil, masalas, flour types like atta/maida).

OUTPUT FORMAT:
Return ONLY a raw JSON string matching the schema below. No markdown wrappers, no conversational text.

SCHEMA:
{
  "dish_name": "string (overall meal name, e.g. 'Indian Thali' or 'Roti with Dal')",
  "calories": number (total for entire meal),
  "macros": {
    "protein_g": number (total),
    "fats_g": number (total),
    "carbs_g": number (total)
  },
  "micros": {
    "fiber_g": number (total),
    "sugar_g": number (total),
    "sodium_mg": number (total)
  },
  "confidence_score": number (0-1),
  "detected_items": [
    {
      "name": "string (e.g. 'Roti', 'Dal Tadka', 'Jeera Rice')",
      "quantity": "string (e.g. '2', '1 bowl', '1 plate', '3 pieces')",
      "calories": number (for this item at this quantity),
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "fiber_g": number
    }
  ]
}

CRITICAL RULES:
- detected_items MUST contain at least 1 item.
- The sum of all detected_items calories should approximately equal the total calories.
- Be specific with quantities: "2" not "some", "1 bowl" not "a portion".`;

// ── Meal Category (DB-safe values only) ──────────────────────
function getMealCategory(hour: number): MealCategory {
  if (hour >= 6 && hour < 10) return "Breakfast";
  if (hour >= 10 && hour < 12) return "Morning Snack";
  if (hour >= 12 && hour < 15) return "Lunch";
  if (hour >= 15 && hour < 18) return "Evening Snack";
  return "Dinner";
}

// ── Provider 1: GitHub Models (GPT-4o) ───────────────────────
async function callGitHubModels(base64: string, mime: string): Promise<string> {
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
          { role: "system", content: VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image." },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub Models ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Provider 2: Google AI Studio (Gemini 2.0 Flash) ──────────
async function callGemini(base64: string, mime: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: VISION_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [
              { text: "Analyze this food image." },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Provider 3: Groq Cloud (Llama 3.2 11B Vision) ───────────
async function callGroq(base64: string, mime: string): Promise<string> {
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
          { role: "system", content: VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image." },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Output Normalizer ────────────────────────────────────────
// Strips markdown fences, parses JSON, and guarantees the
// exact schema shape regardless of which model responded.
function normalizeOutput(raw: string): ParsedNutrition {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(clean);

  if (!parsed || !parsed.dish_name) {
    throw new Error("Missing dish_name in AI response");
  }

  // Parse detected_items if present, otherwise create a single item fallback
  const detectedItems: DetectedItem[] = [];
  if (Array.isArray(parsed.detected_items) && parsed.detected_items.length > 0) {
    for (const item of parsed.detected_items) {
      detectedItems.push({
        name: String(item.name || "Unknown Item"),
        quantity: String(item.quantity || "1"),
        calories: Number(item.calories) || 0,
        protein_g: Number(item.protein_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        fats_g: Number(item.fats_g) || 0,
        fiber_g: Number(item.fiber_g) || 0,
      });
    }
  } else {
    // Fallback: wrap the entire meal as a single detected item
    detectedItems.push({
      name: String(parsed.dish_name),
      quantity: "1 serving",
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.macros?.protein_g) || 0,
      carbs_g: Number(parsed.macros?.carbs_g) || 0,
      fats_g: Number(parsed.macros?.fats_g) || 0,
      fiber_g: Number(parsed.micros?.fiber_g) || 0,
    });
  }

  return {
    dish_name: String(parsed.dish_name),
    calories: Number(parsed.calories) || 0,
    macros: {
      protein_g: Number(parsed.macros?.protein_g) || 0,
      fats_g: Number(parsed.macros?.fats_g) || 0,
      carbs_g: Number(parsed.macros?.carbs_g) || 0,
    },
    micros: {
      fiber_g: Number(parsed.micros?.fiber_g) || 0,
      sugar_g: Number(parsed.micros?.sugar_g) || 0,
      sodium_mg: Number(parsed.micros?.sodium_mg) || 0,
    },
    confidence_score: Number(parsed.confidence_score) || 0,
    detected_items: detectedItems,
  };
}

// ── The Provider Cascade ─────────────────────────────────────
const PROVIDERS: VisionProvider[] = [
  { name: "GitHub Models (GPT-4o)", call: callGitHubModels },
  { name: "Gemini 2.0 Flash", call: callGemini },
  { name: "Groq (Llama 3.2 Vision)", call: callGroq },
];

// ── POST Handler ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // ── 1. Session Binding & Auth Shield ─────────────────────
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("Supabase client creation failed:", err);
    return NextResponse.json(
      { error: "Internal server configuration error." },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn(
      "Auth failure on /api/snap:",
      authError?.message ?? "No user session"
    );
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 }
    );
  }

  try {
    // ── 2. Validate Request Body ─────────────────────────────
    const body = await request.json();
    const { image, mimeType, localHour } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image data provided. Please send a Base64 image." },
        { status: 400 }
      );
    }

    const mime = mimeType || "image/jpeg";

    // ── 3. Triple-Tier Failover Loop ─────────────────────────
    let normalized: ParsedNutrition | null = null;
    let usedProvider = "";
    const errors: string[] = [];

    for (const provider of PROVIDERS) {
      try {
        console.log(`[Snap] Trying ${provider.name}...`);
        const rawText = await provider.call(image, mime);
        normalized = normalizeOutput(rawText);
        usedProvider = provider.name;
        console.log(`[Snap] ✓ ${provider.name} succeeded`);
        break; // Success — exit the loop
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown provider error";
        errors.push(`${provider.name}: ${msg}`);
        console.warn(`[Snap] ✗ ${provider.name} failed:`, msg);
        // Continue to next provider
      }
    }

    if (!normalized) {
      console.error("[Snap] All providers failed:", errors);
      return NextResponse.json(
        {
          error:
            "All AI models are currently unavailable. Please try again in a moment.",
          details: errors,
        },
        { status: 502 }
      );
    }

    // ── 4. Flatten into DB-safe values ───────────────────────
    const calories = normalized.calories;
    const protein = normalized.macros.protein_g;
    const fats = normalized.macros.fats_g;
    const carbs = normalized.macros.carbs_g;
    const fiber = normalized.micros.fiber_g;

    // Build items array from AI-detected individual items
    const items = normalized.detected_items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      ingredients: [] as string[],
      macros: {
        calories: item.calories,
        protein: item.protein_g,
        carbs: item.carbs_g,
        fats: item.fats_g,
        fiber: item.fiber_g,
      },
    }));

    // ── 5. Determine Meal Category ───────────────────────────
    const hr =
      typeof localHour === "number" ? localHour : new Date().getHours();
    const mealCategory = getMealCategory(hr);

    // ── 6. Insert into Supabase (dedicated try/catch) ────────
    const dbPayload = {
      user_id: user.id,
      meal_category: mealCategory,
      items_json: items,
      total_calories: calories,
      total_protein: protein,
      total_carbs: carbs,
      total_fats: fats,
      total_fiber: fiber,
      logged_at: new Date().toISOString(),
    };

    let foodLog;
    try {
      const { data, error: dbError } = await supabase
        .from("food_logs")
        .insert(dbPayload)
        .select()
        .single();

      if (dbError) {
        console.error("DB Insert Error Details:", {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          payload: dbPayload,
        });
        return NextResponse.json(
          { error: "Failed to save food entry to database. Please try again." },
          { status: 500 }
        );
      }

      foodLog = data;
    } catch (dbCrash) {
      console.error("DB Insert Unexpected Crash:", dbCrash);
      console.error("Payload that caused crash:", dbPayload);
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 500 }
      );
    }

    // ── 7. Success Response (exact data shape retained) ──────
    return NextResponse.json({
      success: true,
      logId: foodLog.id,
      log: foodLog,
      provider: usedProvider,
      analysis: {
        items,
        total_macros: { calories, protein, carbs, fats, fiber },
      },
    });
  } catch (error) {
    console.error("Snap route unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to upload an image." },
    { status: 405 }
  );
}
