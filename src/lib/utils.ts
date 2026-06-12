import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx.
 * Used by shadcn/ui components and throughout the app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a readable string with optional decimal places.
 */
export function formatMacro(value: number, decimals: number = 0): string {
  return value.toFixed(decimals);
}

/**
 * Get a greeting based on the current time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Format a date to a readable string like "Thursday, June 12"
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Convert a File to base64 string (for sending to Gemini API).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate percentage progress, capped at 100%.
 */
export function calcProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}
