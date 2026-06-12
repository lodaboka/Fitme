"use client";

// ============================================================
// Fit Me v2.1 — Dashboard Client Component
// Skeleton loading → animated data reveal
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { Menu, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { Profile, FoodLog, DailyMacroTotals } from "@/lib/types";
import { getGreeting } from "@/lib/utils";
import CalorieRing from "@/components/CalorieRing";
import MacroCard from "@/components/MacroCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import MealTimeline from "@/components/MealTimeline";
import MacroWarning from "@/components/MacroWarning";
import HamburgerMenu from "@/components/HamburgerMenu";
import Navbar from "@/components/Navbar";

interface DashboardClientProps {
  profile: Profile;
  allLogs: FoodLog[];
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-24 bg-[var(--background)]">
      {/* Header skeleton */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl skeleton-pulse" />
          <div>
            <div className="h-3 w-20 skeleton-pulse mb-2" />
            <div className="h-5 w-28 skeleton-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl skeleton-pulse" />
      </div>

      <div className="px-5 space-y-6">
        {/* Ring skeleton */}
        <div className="card-elevated py-8 flex flex-col items-center">
          <div className="w-[220px] h-[220px] rounded-full skeleton-pulse" />
        </div>

        {/* Macro cards skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-elevated p-4 flex-1 min-w-[100px] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl skeleton-pulse" />
                <div className="h-3 w-12 skeleton-pulse" />
              </div>
              <div className="h-5 w-16 skeleton-pulse" />
              <div className="h-[5px] w-full skeleton-pulse rounded-full" />
            </div>
          ))}
        </div>

        {/* Calendar skeleton */}
        <div>
          <div className="h-4 w-40 skeleton-pulse mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-1 h-16 skeleton-pulse rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Meals skeleton */}
        <div>
          <div className="flex justify-between mb-3">
            <div className="h-4 w-28 skeleton-pulse" />
            <div className="h-7 w-24 skeleton-pulse rounded-full" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="card-elevated p-4 mb-3 flex gap-3">
              <div className="w-12 h-12 rounded-xl skeleton-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 skeleton-pulse" />
                <div className="h-3 w-32 skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({
  profile,
  allLogs,
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Show skeleton for 800ms on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter logs for selected date
  const todayLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const logDate = new Date(log.logged_at);
      return (
        logDate.getFullYear() === selectedDate.getFullYear() &&
        logDate.getMonth() === selectedDate.getMonth() &&
        logDate.getDate() === selectedDate.getDate()
      );
    });
  }, [allLogs, selectedDate]);

  // Calculate daily totals
  const totals: DailyMacroTotals = useMemo(() => {
    return todayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.total_calories || 0),
        protein: acc.protein + (log.total_protein || 0),
        carbs: acc.carbs + (log.total_carbs || 0),
        fats: acc.fats + (log.total_fats || 0),
        fiber: acc.fiber + (log.total_fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [todayLogs]);

  // Check for exceeded macros
  const exceededMacros = useMemo(() => {
    const exceeded: { name: string; current: number; goal: number }[] = [];
    if (totals.calories > profile.daily_calories_goal)
      exceeded.push({ name: "Calories", current: totals.calories, goal: profile.daily_calories_goal });
    if (totals.protein > profile.daily_protein_goal)
      exceeded.push({ name: "Protein", current: totals.protein, goal: profile.daily_protein_goal });
    if (totals.carbs > profile.daily_carbs_goal)
      exceeded.push({ name: "Carbs", current: totals.carbs, goal: profile.daily_carbs_goal });
    if (totals.fats > profile.daily_fat_goal)
      exceeded.push({ name: "Fats", current: totals.fats, goal: profile.daily_fat_goal });
    return exceeded;
  }, [totals, profile]);

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--background)] animate-fade-in">
      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={profile.name || "User"}
        avatarUrl={profile.avatar_url}
      />

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            id="hamburger-btn"
          >
            <Menu className="w-5 h-5 text-[var(--fm-text-primary)]" />
          </button>
          <div>
            <p className="text-xs text-[var(--fm-text-muted)]">
              {getGreeting()} 👋
            </p>
            <h1
              className="text-lg font-bold text-[var(--fm-text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {profile.name || "User"}
            </h1>
          </div>
        </div>
        <button className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-[var(--fm-text-muted)]" />
        </button>
      </div>

      <div className="px-5 space-y-6">
        {/* Macro Warnings */}
        <MacroWarning exceededMacros={exceededMacros} />

        {/* Calorie Ring */}
        <div className="card-elevated py-8 flex flex-col items-center">
          <CalorieRing
            consumed={totals.calories}
            goal={profile.daily_calories_goal}
          />
        </div>

        {/* Macro Cards Row */}
        <div className="flex gap-3">
          <MacroCard
            label="Protein"
            current={totals.protein}
            goal={profile.daily_protein_goal}
            color="var(--fm-protein)"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 6.5c1.5-1.5 3.5-1.5 5 0s1.5 3.5 0 5l-5 5-5-5c-1.5-1.5-1.5-3.5 0-5s3.5-1.5 5 0z"/>
                <path d="M17.5 6.5c1.5-1.5 3.5-1.5 5 0s1.5 3.5 0 5l-5 5-5-5"/>
              </svg>
            }
          />
          <MacroCard
            label="Fats"
            current={totals.fats}
            goal={profile.daily_fat_goal}
            color="var(--fm-fats)"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/>
              </svg>
            }
          />
          <MacroCard
            label="Carbs"
            current={totals.carbs}
            goal={profile.daily_carbs_goal}
            color="var(--fm-carbs)"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            }
          />
        </div>

        {/* Weekly Calendar */}
        <div>
          <h2
            className="text-base font-bold text-[var(--fm-text-primary)] mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Track your diet journey
          </h2>
          <WeeklyCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Meal Log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-bold text-[var(--fm-text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Today&apos;s Meals
            </h2>
            <Link
              href="/snap"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--fm-green-bg)] text-[var(--fm-green-dark)] text-xs font-medium hover:bg-[var(--fm-green)]/15 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Meal
            </Link>
          </div>
          <MealTimeline logs={todayLogs} />
        </div>
      </div>

      <Navbar />
    </div>
  );
}
