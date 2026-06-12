// ============================================================
// Fit Me — Time-Based Meal Categorization
// ============================================================

import { MealCategory } from "./types";

/**
 * Determines the meal category based on the current local time.
 *
 * Time Ranges:
 *   06:00 - 10:00 → Breakfast
 *   10:00 - 13:00 → Morning Snack
 *   13:00 - 16:00 → Lunch
 *   16:00 - 19:00 → Evening Snack
 *   19:00 - 23:00 → Dinner
 *   23:00 - 06:00 → Dinner (late night defaults to dinner)
 */
export function getMealCategory(date: Date = new Date()): MealCategory {
  const hours = date.getHours();

  if (hours >= 6 && hours < 9) return "Morning Snack";
  if (hours >= 9 && hours < 12) return "Breakfast";
  if (hours >= 12 && hours < 15) return "Lunch";
  if (hours >= 15 && hours < 18) return "Evening Snack";
  if (hours >= 18 && hours < 24) return "Dinner";
  return "Late Night"; // 00:00 to 06:00
}

export const MEAL_CATEGORIES: MealCategory[] = [
  "Morning Snack",
  "Breakfast",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Late Night"
];

export const MEAL_CATEGORY_ICONS: Record<MealCategory, string> = {
  "Morning Snack": "🍎",
  Breakfast: "☀️",
  Lunch: "🍛",
  "Evening Snack": "🍪",
  Dinner: "🌙",
  "Late Night": "🦉"
};

export const MEAL_CATEGORY_TIMES: Record<MealCategory, string> = {
  "Morning Snack": "6:00 AM - 9:00 AM",
  Breakfast: "9:00 AM - 12:00 PM",
  Lunch: "12:00 PM - 3:00 PM",
  "Evening Snack": "3:00 PM - 6:00 PM",
  Dinner: "6:00 PM - 12:00 AM",
  "Late Night": "12:00 AM - 6:00 AM"
};
