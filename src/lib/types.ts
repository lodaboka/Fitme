// ============================================================
// Fit Me v2 — TypeScript Type Definitions
// ============================================================

export type MealCategory =
  | "Breakfast"
  | "Morning Snack"
  | "Lunch"
  | "Evening Snack"
  | "Dinner"
  | "Late Night";

export type Gender = "Male" | "Female" | "Other";
export type Goal = "lose" | "maintain" | "gain";
export type ActivityLevel = "Sedentary" | "Light" | "Moderate" | "Active" | "Very Active";
export type HeightUnit = "cm" | "ft";
export type WeightUnit = "kg" | "lbs";

export interface MacroData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface FoodItem {
  name: string;
  quantity: string;
  ingredients: string[];
  macros: MacroData;
}

export interface SnapResponse {
  items: FoodItem[];
  total_macros: MacroData;
}

export interface Profile {
  id: string;
  name: string;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  height_ft: number | null;
  height_in: number | null;
  height_unit: HeightUnit;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  weight_unit: WeightUnit;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  bmr: number | null;
  tdee: number | null;
  avatar_url: string | null;
  daily_calories_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  meal_category: MealCategory;
  image_url: string | null;
  items_json: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_fiber: number;
  logged_at: string;
  created_at: string;
}

export interface DailyMacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

// Onboarding multi-step data
export interface OnboardingData {
  name: string;
  age: number;
  gender: Gender;
  heightUnit: HeightUnit;
  heightCm: number;
  heightFt: number;
  heightIn: number;
  weightUnit: WeightUnit;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  dailyCaloriesGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatGoal: number;
}

// Chart data for recharts
export interface ChartDataPoint {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
