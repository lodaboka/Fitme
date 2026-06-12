// ============================================================
// Fit Me — Snap API Route (Food Image Analysis & Insertion)
// POST /api/snap
// Handles receiving Base64 image, analyzing it via Gemini, 
// determining time-based meal category, and saving to Supabase.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const { image, mimeType, localHour } = body;

    if (!image) {
      return NextResponse.json({ error: "No image data provided. Please send a Base64 image." }, { status: 400 });
    }

    // 3. Analyze food using GitHub Models (gpt-4o) with the Nutritionist prompt
    const systemPrompt = `You are a expert nutritionist specializing in South Asian and Indian cuisine. 
Your task is to analyze the food image and calculate the precise nutritional breakdown.

OUTPUT REQUIREMENTS:
- You must return ONLY valid JSON. No markdown backticks, no conversational text.
- If the food is Indian, account for typical preparation methods (e.g., oil/ghee usage, flour types).
- Portion sizes must be estimated based on a standard plate/bowl size.

JSON SCHEMA:
{
  "dish_name": "string",
  "calories": number,
  "macros": {
    "protein_g": number,
    "fats_g": number,
    "carbs_g": number
  },
  "micros": {
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number
  },
  "confidence_score": number
}`;
    
    // Convert base64 format for OpenAI-compatible payload
    const imagePayload = `data:${mimeType || "image/jpeg"};base64,${image}`;

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error("GITHUB_TOKEN is not configured");
    }

    const aiResponse = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${githubToken}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image." },
              {
                type: "image_url",
                image_url: { url: imagePayload }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("GitHub Models Error:", err);
      throw new Error(`AI inference failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices[0]?.message?.content || "";

    // Ultimate Response Sanitization
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    if (!parsed || !parsed.dish_name) {
      return NextResponse.json(
        { error: "Could not identify any food in this image. Please take a clearer photo." },
        { status: 422 }
      );
    }

    // Adapt the new schema to the existing FoodItem structure
    const macros = parsed.macros || {};
    const micros = parsed.micros || {};

    const items = [
      {
        name: parsed.dish_name || "Unknown Dish",
        quantity: "1 serving",
        ingredients: [],
        macros: {
          calories: parsed.calories || 0,
          protein: macros.protein_g || 0,
          carbs: macros.carbs_g || 0,
          fats: macros.fats_g || 0,
          fiber: micros.fiber_g || 0
        }
      }
    ];

    const hr = typeof localHour === "number" ? localHour : new Date().getHours();
    let mealCategory: "Breakfast" | "Morning Snack" | "Lunch" | "Evening Snack" | "Dinner" | "Late Night" = "Breakfast";

    if (hr >= 6 && hr < 9) mealCategory = "Morning Snack";
    else if (hr >= 9 && hr < 12) mealCategory = "Breakfast";
    else if (hr >= 12 && hr < 15) mealCategory = "Lunch";
    else if (hr >= 15 && hr < 18) mealCategory = "Evening Snack";
    else if (hr >= 18 && hr < 24) mealCategory = "Dinner";
    else mealCategory = "Late Night";

    const { data: foodLog, error: dbError } = await supabase
      .from("food_logs")
      .insert({
        user_id: user.id,
        meal_category: mealCategory,
        items_json: items,
        total_calories: parsed.calories || 0,
        total_protein: macros.protein_g || 0,
        total_carbs: macros.carbs_g || 0,
        total_fats: macros.fats_g || 0,
        total_fiber: micros.fiber_g || 0,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database Save Error:", dbError);
      return NextResponse.json({ error: "Failed to log food entry to database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logId: foodLog.id,
      log: foodLog,
      // Map it out in a way MealResultCard handles if needed, or let MealResultCard adapt
      // To ensure MealResultCard doesn't crash during the "Go to Dashboard" redirect:
      analysis: {
        items: items,
        total_macros: {
          calories: parsed.calories || 0,
          protein: macros.protein_g || 0,
          carbs: macros.carbs_g || 0,
          fats: macros.fats_g || 0,
          fiber: micros.fiber_g || 0
        }
      },
    });
  } catch (error) {
    console.error("Snap route error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
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
