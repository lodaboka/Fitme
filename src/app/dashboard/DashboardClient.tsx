"use client";

// ============================================================
// Fit Me v3 — Dashboard Client (Liquid Glass Theme)
// Framer Motion animations, glass panels, fluid interactions
// ============================================================

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
import AiInsightBubble from "@/components/AiInsightBubble";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

interface DashboardClientProps {
  profile: Profile;
  allLogs: FoodLog[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

export default function DashboardClient({
  profile,
  allLogs,
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [logs, setLogs] = useState(allLogs);

  // Handle meal deletion — remove from local state
  const handleDeleteLog = useCallback((logId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== logId));
  }, []);

  // Show skeleton for 800ms on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter logs for selected date
  const todayLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.logged_at);
      return (
        logDate.getFullYear() === selectedDate.getFullYear() &&
        logDate.getMonth() === selectedDate.getMonth() &&
        logDate.getDate() === selectedDate.getDate()
      );
    });
  }, [logs, selectedDate]);

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
    <motion.div
      className="min-h-screen pb-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={profile.name || "User"}
        avatarUrl={profile.avatar_url}
      />

      {/* Header */}
      <motion.div
        className="px-5 pt-14 pb-4 flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-2xl glass-card flex items-center justify-center transition-all duration-200"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            id="hamburger-btn"
          >
            <Menu className="w-5 h-5 text-[var(--fm-text-primary)]" />
          </motion.button>
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
        <motion.button
          className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-2xl glass-card flex items-center justify-center transition-all duration-200"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
        >
          <Bell className="w-5 h-5 text-[var(--fm-text-muted)]" />
        </motion.button>
      </motion.div>

      <div className="px-5 space-y-6">
        {/* Macro Warnings */}
        <MacroWarning exceededMacros={exceededMacros} />

        {/* Calorie Ring */}
        <motion.div
          className="glass-panel py-8 flex flex-col items-center"
          variants={itemVariants}
        >
          <CalorieRing
            consumed={totals.calories}
            goal={profile.daily_calories_goal}
          />
        </motion.div>

        {/* Macro Cards Row */}
        <motion.div className="flex gap-3" variants={itemVariants}>
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
        </motion.div>

        {/* AI Coach Insight Bubble */}
        <motion.div variants={itemVariants}>
          <AiInsightBubble />
        </motion.div>

        {/* Weekly Calendar */}
        <motion.div variants={itemVariants}>
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
        </motion.div>

        {/* Meal Log */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-bold text-[var(--fm-text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Today&apos;s Meals
            </h2>
            <Link
              href="/snap"
              className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full glass-card text-[var(--fm-green-dark)] text-xs font-medium hover:shadow-md transition-all duration-200 ease-out active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Meal
            </Link>
          </div>
          <MealTimeline logs={todayLogs} onDelete={handleDeleteLog} />
        </motion.div>
      </div>

      <Navbar />
    </motion.div>
  );
}
