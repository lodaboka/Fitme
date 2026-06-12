// ============================================================
// Fit Me v2 — BMR, TDEE & Goal Calculations
// Uses Mifflin-St Jeor equation (most accurate for general pop)
// ============================================================

import { Gender, Goal, ActivityLevel } from "./types";

/**
 * Activity level multipliers for TDEE calculation.
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,      // Little or no exercise
  Light: 1.375,        // Light exercise 1-3 days/week
  Moderate: 1.55,      // Moderate exercise 3-5 days/week
  Active: 1.725,       // Hard exercise 6-7 days/week
  "Very Active": 1.9,  // Very hard exercise, physical job
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation.
 * Male:   BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5
 * Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 * Other:  Average of male and female
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  switch (gender) {
    case "Male":
      return Math.round(base + 5);
    case "Female":
      return Math.round(base - 161);
    case "Other":
      return Math.round(base - 78); // Average of +5 and -161
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure).
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculate the projected date to reach target weight.
 * 1 kg of body weight ≈ 7700 calories (accepted estimate).
 *
 * @param currentWeightKg - Current weight in kg
 * @param targetWeightKg - Target weight in kg
 * @param dailyCalorieTarget - Daily calorie intake target
 * @param tdee - Total daily energy expenditure
 * @returns { days, months, targetDate } or null if maintaining
 */
export function calculateGoalDate(
  currentWeightKg: number,
  targetWeightKg: number,
  dailyCalorieTarget: number,
  tdee: number
): { days: number; months: number; remainderDays: number; targetDate: Date } | null {
  const weightDifference = Math.abs(currentWeightKg - targetWeightKg);

  if (weightDifference < 0.1) return null; // Already at goal

  // Daily deficit or surplus
  const dailyDelta = Math.abs(tdee - dailyCalorieTarget);

  if (dailyDelta < 50) return null; // Too small to project

  // Total calories needed to lose/gain the weight
  const totalCalories = weightDifference * 7700;

  // Days to reach goal
  const days = Math.ceil(totalCalories / dailyDelta);
  const months = Math.floor(days / 30);
  const remainderDays = days % 30;

  // Target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  return { days, months, remainderDays, targetDate };
}

/**
 * Calculate recommended macro split based on calorie target and goal.
 * - Lose weight: Higher protein (35%), moderate carbs (40%), lower fat (25%)
 * - Maintain:    Balanced (30% protein, 45% carbs, 25% fat)
 * - Gain weight:  Higher carbs (50%), moderate protein (25%), moderate fat (25%)
 */
export function calculateMacroSplit(
  targetCalories: number,
  goal: Goal
): { protein: number; carbs: number; fat: number } {
  let proteinPct: number, carbsPct: number, fatPct: number;

  switch (goal) {
    case "lose":
      proteinPct = 0.35;
      carbsPct = 0.40;
      fatPct = 0.25;
      break;
    case "gain":
      proteinPct = 0.25;
      carbsPct = 0.50;
      fatPct = 0.25;
      break;
    case "maintain":
    default:
      proteinPct = 0.30;
      carbsPct = 0.45;
      fatPct = 0.25;
      break;
  }

  // Calories per gram: Protein=4, Carbs=4, Fat=9
  return {
    protein: Math.round((targetCalories * proteinPct) / 4),
    carbs: Math.round((targetCalories * carbsPct) / 4),
    fat: Math.round((targetCalories * fatPct) / 9),
  };
}

/**
 * Convert height from feet/inches to centimeters.
 */
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
}

/**
 * Convert height from centimeters to feet and inches.
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Convert weight from lbs to kg.
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

/**
 * Convert weight from kg to lbs.
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}
