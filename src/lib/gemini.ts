// ============================================================
// Fit Me — Gemini AI Client & Food Analysis
// ============================================================

import { GoogleGenAI } from "@google/genai";
import { SnapResponse } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY is not set. The Snap feature will not work."
  );
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

/**
 * The highly-tuned system prompt for Indian food analysis.
 * This prompt is designed to extract accurate nutritional data
 * from photos of Indian meals with complex dishes and portions.
 */
export const FOOD_ANALYSIS_SYSTEM_PROMPT = `You are an expert Indian nutritionist and food analyst with 20+ years of experience analyzing Indian cuisine, street food, and home-cooked meals. You have deep expertise in:
- Traditional Indian cooking methods and their caloric impact
- Regional Indian cuisines (North Indian, South Indian, Bengali, Gujarati, etc.)
- Estimating portions from visual cues in food photographs
- Understanding hidden calories in Indian cooking (ghee, oil, butter, cream)

TASK: Analyze the food image provided and identify EVERY dish, ingredient, and portion visible.

CRITICAL RULES FOR INDIAN FOOD ANALYSIS:
1. ROTI/CHAPATI: Count each piece individually. Whole wheat roti ≈ 100-120 kcal each. Paratha ≈ 180-220 kcal each (account for oil/ghee used in cooking). Naan ≈ 260-300 kcal each. Tandoori roti ≈ 120 kcal.
2. RICE: Estimate cups of cooked rice. 1 cup cooked basmati rice ≈ 200g ≈ 210 kcal. Jeera rice/pulao adds 30-50 kcal per cup. Biryani rice ≈ 300 kcal per cup.
3. DAL/LENTILS: 1 medium bowl (~200ml) of dal ≈ 150-200 kcal. Account for tadka (tempering) oil, typically 1-2 tsp = 40-80 kcal extra. Dal makhani with cream/butter ≈ 250-300 kcal per bowl.
4. CURRIES: Estimate oil content based on visual oiliness (oil floating on top = more oil). Dry sabzi ≈ 100-150 kcal per serving. Gravy-based curry ≈ 200-300 kcal per serving. Cream/cashew-based gravies (paneer butter masala, etc.) ≈ 300-400 kcal.
5. PORTION SIZES: Be specific — use "1 medium bowl (~200ml)", "2 whole wheat rotis", "1 cup cooked rice", "1 small plate".
6. COOKING OIL: Indian home cooking typically uses 1-2 tablespoons oil per dish. Street food uses significantly more. Each tablespoon of oil = 120 kcal, 14g fat.
7. ACCOMPANIMENTS: Don't forget raita (~50-80 kcal), pickle (~20 kcal), papad (~50 kcal), salad.
8. SWEETS/DESSERTS: Indian sweets are calorie-dense. Gulab jamun ≈ 150 kcal each, rasgulla ≈ 120 kcal each, laddu ≈ 300-400 kcal each.

If the image does NOT contain food, or is unclear/unrecognizable, return:
{"items": [], "total_macros": {"calories": 0, "protein": 0, "carbs": 0, "fats": 0, "fiber": 0}, "error": "Could not identify food in the image. Please take a clearer photo."}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO explanatory text. The response must be parseable by JSON.parse() directly.

JSON SCHEMA:
{
  "items": [
    {
      "name": "string (dish name in English)",
      "quantity": "string (amount with unit, e.g. '2 whole wheat rotis', '1 medium bowl ~200ml')",
      "ingredients": ["string (key ingredients)"],
      "macros": {
        "calories": number,
        "protein": number (grams),
        "carbs": number (grams),
        "fats": number (grams),
        "fiber": number (grams)
      }
    }
  ],
  "total_macros": {
    "calories": number (sum of all items),
    "protein": number (sum),
    "carbs": number (sum),
    "fats": number (sum),
    "fiber": number (sum)
  }
}`;

/**
 * Analyze a food image using Gemini 2.5 Flash.
 * Takes a base64-encoded image and returns structured macro data.
 */
export async function analyzeFood(
  imageBase64: string,
  mimeType: string
): Promise<SnapResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: FOOD_ANALYSIS_SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            {
              text: "Analyze this food image and return the nutritional breakdown as JSON.",
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Low temperature for consistent, factual output
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  quantity: { type: "STRING" },
                  ingredients: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                  macros: {
                    type: "OBJECT",
                    properties: {
                      calories: { type: "NUMBER" },
                      protein: { type: "NUMBER" },
                      carbs: { type: "NUMBER" },
                      fats: { type: "NUMBER" },
                      fiber: { type: "NUMBER" },
                    },
                    required: ["calories", "protein", "carbs", "fats", "fiber"],
                  },
                },
                required: ["name", "quantity", "ingredients", "macros"],
              },
            },
            total_macros: {
              type: "OBJECT",
              properties: {
                calories: { type: "NUMBER" },
                protein: { type: "NUMBER" },
                carbs: { type: "NUMBER" },
                fats: { type: "NUMBER" },
                fiber: { type: "NUMBER" },
              },
              required: ["calories", "protein", "carbs", "fats", "fiber"],
            },
          },
          required: ["items", "total_macros"],
        },
      },
    });

    // 1. Extract the text safely regardless of SDK version quirks
    const rawText = typeof (response as any)?.text === "function" ? (response as any).text() : (response?.text ?? "");

    // 2. Clear out any potential markdown backtick wrappers or prefixes
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    console.log("Sanitized JSON Payload for Parser:", cleanText);

    // 3. Run the safe parse
    const parsed: SnapResponse = JSON.parse(cleanText);

    // Validate the response structure
    if (!parsed || !parsed.items || !parsed.total_macros) {
      throw new Error("Invalid response structure from AI");
    }

    // Ensure all numeric values are actual numbers
    parsed.total_macros = {
      calories: Number(parsed.total_macros.calories) || 0,
      protein: Number(parsed.total_macros.protein) || 0,
      carbs: Number(parsed.total_macros.carbs) || 0,
      fats: Number(parsed.total_macros.fats) || 0,
      fiber: Number(parsed.total_macros.fiber) || 0,
    };

    parsed.items = parsed.items.map((item) => ({
      ...item,
      macros: {
        calories: Number(item.macros?.calories) || 0,
        protein: Number(item.macros?.protein) || 0,
        carbs: Number(item.macros?.carbs) || 0,
        fats: Number(item.macros?.fats) || 0,
        fiber: Number(item.macros?.fiber) || 0,
      },
    }));

    return parsed;
  } catch (error) {
    console.error("Gemini processing error details:", error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "AI returned an invalid JSON structure. Please try again with a clearer image."
      );
    }
    throw error;
  }
}
