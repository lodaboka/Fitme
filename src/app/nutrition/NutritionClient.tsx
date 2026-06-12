"use client";

// ============================================================
// Fit Me v2 — Nutrition Client (My Meals)
// Meal category tabs, date selector, food item cards
// ============================================================

import { useState, useMemo } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { FoodLog, MealCategory } from "@/lib/types";
import MealTimeline from "@/components/MealTimeline";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import Navbar from "@/components/Navbar";

interface NutritionClientProps {
  logs: FoodLog[];
}

const MEAL_TABS: { label: string; value: MealCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Breakfast", value: "Breakfast" },
  { label: "Lunch", value: "Lunch" },
  { label: "Dinner", value: "Dinner" },
];

export default function NutritionClient({ logs }: NutritionClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<MealCategory | "all">("all");

  // Filter logs by selected date
  const dayLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.logged_at);
      return (
        logDate.getFullYear() === selectedDate.getFullYear() &&
        logDate.getMonth() === selectedDate.getMonth() &&
        logDate.getDate() === selectedDate.getDate()
      );
    });
  }, [logs, selectedDate]);

  // Daily summary
  const daySummary = useMemo(() => {
    return dayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.total_calories || 0),
        meals: acc.meals + 1,
      }),
      { calories: 0, meals: 0 }
    );
  }, [dayLogs]);

  return (
    <div className="min-h-screen pb-24 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--fm-text-primary)]" />
        </Link>
        <div className="flex-1">
          <h1
            className="text-xl font-bold text-[var(--fm-text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My Meals
          </h1>
        </div>
        <Link
          href="/snap"
          className="w-10 h-10 rounded-xl bg-[var(--fm-green)] flex items-center justify-center shadow-sm shadow-[var(--fm-green)]/20"
        >
          <Plus className="w-5 h-5 text-white" />
        </Link>
      </div>

      <div className="px-5 space-y-5">
        {/* Weekly Calendar */}
        <WeeklyCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Daily Summary */}
        <div className="flex gap-3">
          <div className="card-elevated p-3 flex-1 text-center">
            <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              {Math.round(daySummary.calories)}
            </p>
            <p className="text-[10px] text-[var(--fm-text-muted)]">Total kcal</p>
          </div>
          <div className="card-elevated p-3 flex-1 text-center">
            <p className="text-lg font-bold text-[var(--fm-green)]" style={{ fontFamily: "var(--font-heading)" }}>
              {daySummary.meals}
            </p>
            <p className="text-[10px] text-[var(--fm-text-muted)]">Meals logged</p>
          </div>
        </div>

        {/* Meal Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {MEAL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedMeal(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedMeal === tab.value
                  ? "bg-[var(--fm-green)] text-white shadow-sm"
                  : "bg-white text-[var(--fm-text-muted)] border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Meal List */}
        <MealTimeline logs={dayLogs} selectedMealType={selectedMeal} />
      </div>

      <Navbar />
    </div>
  );
}
