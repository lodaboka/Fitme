"use client";

// ============================================================
// Fit Me v2.1 — Calorie Slider Component
// Draggable slider with smart surplus/deficit warnings
// ============================================================

import { useMemo } from "react";
import { calculateGoalDate, calculateMacroSplit } from "@/lib/calculations";
import { AlertTriangle } from "lucide-react";
import type { Goal } from "@/lib/types";

interface CalorieSliderProps {
  tdee: number;
  value: number;
  onChange: (calories: number) => void;
  goal: Goal;
  currentWeightKg: number;
  targetWeightKg: number;
}

export default function CalorieSlider({
  tdee,
  value,
  onChange,
  goal,
  currentWeightKg,
  targetWeightKg,
}: CalorieSliderProps) {
  // Slider range: TDEE ± 1000
  const minCal = Math.max(1000, tdee - 1000);
  const maxCal = tdee + 1000;

  // Calculate projected goal date
  const projection = useMemo(
    () => calculateGoalDate(currentWeightKg, targetWeightKg, value, tdee),
    [currentWeightKg, targetWeightKg, value, tdee]
  );

  // Calculate macro split
  const macros = useMemo(
    () => calculateMacroSplit(value, goal),
    [value, goal]
  );

  const deficit = tdee - value;
  const isDeficit = deficit > 0;
  const isSurplus = deficit < 0;

  // Determine if the user is working AGAINST their goal
  const isCounterGoal = useMemo(() => {
    if (goal === "lose" && isSurplus) return true; // Wants to lose but eating in surplus
    if (goal === "gain" && isDeficit) return true;  // Wants to gain but eating in deficit
    return false;
  }, [goal, isDeficit, isSurplus]);

  const counterGoalWarning = useMemo(() => {
    if (goal === "lose" && isSurplus) {
      return "⚠️ Surplus detected: You will gain weight at this pace.";
    }
    if (goal === "gain" && isDeficit) {
      return "⚠️ Deficit detected: You will lose weight at this pace.";
    }
    return null;
  }, [goal, isDeficit, isSurplus]);

  return (
    <div className="space-y-6">
      {/* TDEE Info */}
      <div className="text-center">
        <p className="text-xs text-[var(--fm-text-muted)]">
          Your maintenance (TDEE)
        </p>
        <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
          {tdee} kcal/day
        </p>
      </div>

      {/* Calorie Display */}
      <div className="text-center">
        <p
          className="text-5xl font-bold text-[var(--fm-green)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </p>
        <p className="text-sm text-[var(--fm-text-muted)] mt-1">
          kcal / day target
        </p>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min={minCal}
          max={maxCal}
          step={50}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              var(--fm-green) 0%, 
              var(--fm-green) ${((value - minCal) / (maxCal - minCal)) * 100}%, 
              #E5E7EB ${((value - minCal) / (maxCal - minCal)) * 100}%, 
              #E5E7EB 100%
            )`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--fm-text-muted)]">{minCal}</span>
          <span className="text-[10px] text-[var(--fm-green)] font-medium">TDEE: {tdee}</span>
          <span className="text-[10px] text-[var(--fm-text-muted)]">{maxCal}</span>
        </div>
      </div>

      {/* Deficit/Surplus Badge */}
      <div className="flex justify-center">
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            isDeficit
              ? "bg-blue-50 text-blue-600"
              : isSurplus
              ? "bg-orange-50 text-orange-600"
              : "bg-gray-100 text-[var(--fm-text-muted)]"
          }`}
        >
          {isDeficit
            ? `${Math.abs(deficit)} kcal deficit`
            : isSurplus
            ? `${Math.abs(deficit)} kcal surplus`
            : "Maintenance"}
        </div>
      </div>

      {/* Counter-Goal Warning (red alert) */}
      {isCounterGoal && counterGoalWarning && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 animate-scale-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-600">
              {counterGoalWarning}
            </p>
          </div>
        </div>
      )}

      {/* Projection — only show when NOT working against goal */}
      {!isCounterGoal && projection && (
        <div className="card-elevated p-4 text-center animate-scale-in">
          <p className="text-xs text-[var(--fm-text-muted)] mb-1">
            You&apos;ll reach your goal in
          </p>
          <div className="flex items-baseline justify-center gap-2">
            {projection.months > 0 && (
              <>
                <span className="text-2xl font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                  {projection.months}
                </span>
                <span className="text-sm text-[var(--fm-text-muted)]">
                  {projection.months === 1 ? "month" : "months"}
                </span>
              </>
            )}
            {projection.remainderDays > 0 && (
              <>
                <span className="text-2xl font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                  {projection.remainderDays}
                </span>
                <span className="text-sm text-[var(--fm-text-muted)]">
                  {projection.remainderDays === 1 ? "day" : "days"}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-[var(--fm-green)] font-medium mt-2">
            📅 {projection.targetDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Auto-calculated macros preview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-[#FF6B6B]/10">
          <p className="text-lg font-bold text-[#FF6B6B]" style={{ fontFamily: "var(--font-heading)" }}>
            {macros.protein}g
          </p>
          <p className="text-[10px] text-[var(--fm-text-muted)]">Protein</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#FFB946]/10">
          <p className="text-lg font-bold text-[#FFB946]" style={{ fontFamily: "var(--font-heading)" }}>
            {macros.carbs}g
          </p>
          <p className="text-[10px] text-[var(--fm-text-muted)]">Carbs</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#4ECDC4]/10">
          <p className="text-lg font-bold text-[#4ECDC4]" style={{ fontFamily: "var(--font-heading)" }}>
            {macros.fat}g
          </p>
          <p className="text-[10px] text-[var(--fm-text-muted)]">Fat</p>
        </div>
      </div>
    </div>
  );
}
