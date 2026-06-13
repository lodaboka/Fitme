"use client";

// ============================================================
// Fit Me v4 — Analytics Client (Liquid Glass Theme)
// Premium glassmorphic visualizations:
// 1. Calorie Goal Adherence (line chart with target baseline)
// 2. Macro Balance Score (donut chart)
// 3. Most Eaten Foods (segmented by meal time, weekly/monthly)
// ============================================================

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import { Profile, FoodLog } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { ArrowLeft, TrendingUp, PieChart as PieIcon, Utensils } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AnalyticsClientProps {
  profile: Profile;
  logs: FoodLog[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
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

const GLASS_TOOLTIP = {
  contentStyle: {
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    fontSize: "12px",
  },
  itemStyle: { color: "var(--fm-text-primary)", fontWeight: 600 },
  labelStyle: { color: "var(--fm-text-muted)", fontSize: "10px" },
};

// ── Most Eaten Foods Helper Types ────────────────────────────
interface MostEatenItem {
  name: string;
  count: number;
  imageUrl: string | null;
}

type MealTimeSlot = "breakfast" | "lunch" | "dinner";

const MEAL_TIME_CONFIG: Record<MealTimeSlot, { emoji: string; label: string; categories: string[] }> = {
  breakfast: {
    emoji: "🌅",
    label: "Most Eaten Breakfast",
    categories: ["Breakfast", "Morning Snack"],
  },
  lunch: {
    emoji: "🍲",
    label: "Most Eaten Lunch",
    categories: ["Lunch"],
  },
  dinner: {
    emoji: "🌙",
    label: "Most Eaten Dinner",
    categories: ["Dinner", "Evening Snack", "Late Night"],
  },
};

export default function AnalyticsClient({ profile, logs }: AnalyticsClientProps) {
  const [mostEatenRange, setMostEatenRange] = useState<"week" | "month">("week");

  // ── 7-day calorie data with goal baseline ──────────────────
  const calorieData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at).toISOString().split("T")[0];
        return logDate === dateStr;
      });

      const totalCals = dayLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);

      data.push({
        label: DAY_LABELS[d.getDay()],
        calories: Math.round(totalCals),
        goal: profile.daily_calories_goal,
      });
    }
    return data;
  }, [logs, profile.daily_calories_goal]);

  // ── Macro averages for donut ──────────────────────────────
  const macroAvg = useMemo(() => {
    const last7 = calorieData.filter((d) => d.calories > 0);
    if (last7.length === 0) return { protein: 0, carbs: 0, fats: 0 };

    const days7Logs = logs.filter((log) => {
      const logDate = new Date(log.logged_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });

    const totals = days7Logs.reduce(
      (acc, log) => ({
        protein: acc.protein + (log.total_protein || 0),
        carbs: acc.carbs + (log.total_carbs || 0),
        fats: acc.fats + (log.total_fats || 0),
      }),
      { protein: 0, carbs: 0, fats: 0 }
    );

    const daysCount = last7.length || 1;
    return {
      protein: Math.round(totals.protein / daysCount),
      carbs: Math.round(totals.carbs / daysCount),
      fats: Math.round(totals.fats / daysCount),
    };
  }, [logs, calorieData]);

  const pieData = [
    { name: "Protein", value: macroAvg.protein, color: "var(--fm-protein)" },
    { name: "Carbs", value: macroAvg.carbs, color: "var(--fm-carbs)" },
    { name: "Fats", value: macroAvg.fats, color: "var(--fm-fats)" },
  ].filter((d) => d.value > 0);

  const totalMacroGrams = pieData.reduce((s, d) => s + d.value, 0);

  // ── Most Eaten Foods (parsed from items_json) ─────────────
  const mostEatenBySlot = useMemo(() => {
    const daysBack = mostEatenRange === "week" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const filteredLogs = logs.filter(
      (log) => new Date(log.logged_at) >= cutoff
    );

    const result: Record<MealTimeSlot, MostEatenItem> = {
      breakfast: { name: "", count: 0, imageUrl: null },
      lunch: { name: "", count: 0, imageUrl: null },
      dinner: { name: "", count: 0, imageUrl: null },
    };

    for (const slot of Object.keys(MEAL_TIME_CONFIG) as MealTimeSlot[]) {
      const config = MEAL_TIME_CONFIG[slot];
      const slotLogs = filteredLogs.filter((log) =>
        config.categories.includes(log.meal_category)
      );

      // Count each unique item name across all meals in this slot
      const freq: Record<string, { count: number; imageUrl: string | null }> = {};

      for (const log of slotLogs) {
        const items = log.items_json;
        if (!Array.isArray(items)) continue;

        for (const item of items) {
          const itemName = (item.name || "").trim().toLowerCase();
          if (!itemName) continue;

          if (!freq[itemName]) {
            freq[itemName] = { count: 0, imageUrl: null };
          }
          freq[itemName].count += 1;
          // Keep the latest image URL for this item
          if (log.image_url) {
            freq[itemName].imageUrl = log.image_url;
          }
        }
      }

      // Find the most frequent
      let topName = "";
      let topCount = 0;
      let topImage: string | null = null;

      for (const [name, data] of Object.entries(freq)) {
        if (data.count > topCount) {
          topName = name;
          topCount = data.count;
          topImage = data.imageUrl;
        }
      }

      result[slot] = {
        name: topName ? topName.charAt(0).toUpperCase() + topName.slice(1) : "",
        count: topCount,
        imageUrl: topImage,
      };
    }

    return result;
  }, [logs, mostEatenRange]);

  const rangeDaysLabel = mostEatenRange === "week" ? "this week" : "this month";
  const hasAnyMostEaten = Object.values(mostEatenBySlot).some((v) => v.count > 0);

  return (
    <motion.div
      className="min-h-screen pb-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 px-5 pt-14 pb-4"
        variants={itemVariants}
      >
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--fm-text-primary)]" />
        </Link>
        <h1
          className="text-xl font-bold text-[var(--fm-text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Analytics
        </h1>
      </motion.div>

      <div className="px-5 space-y-5">
        {/* ── 1. Calorie Goal Adherence ────────────────────────── */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--fm-green)]" />
            Calorie Goal Adherence
          </h3>
          <p className="text-[10px] text-[var(--fm-text-muted)] mb-4">
            Last 7 days vs your {profile.daily_calories_goal} kcal target
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--fm-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--fm-text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip {...GLASS_TOOLTIP} />
              <ReferenceLine
                y={profile.daily_calories_goal}
                stroke="rgba(16,185,129,0.4)"
                strokeDasharray="6 4"
                label={{
                  value: "Goal",
                  position: "insideTopRight",
                  fill: "var(--fm-green)",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="var(--fm-green)"
                strokeWidth={2.5}
                dot={{ fill: "var(--fm-green)", r: 4, strokeWidth: 2, stroke: "rgba(16,185,129,0.3)" }}
                activeDot={{ r: 7, fill: "var(--fm-green)", stroke: "rgba(16,185,129,0.2)", strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── 2. Macro Balance Score (Donut) ───────────────────── */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-1 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[var(--fm-carbs)]" />
            Macro Balance
          </h3>
          <p className="text-[10px] text-[var(--fm-text-muted)] mb-4">
            Average daily macro distribution
          </p>

          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 150, height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                      {totalMacroGrams}
                    </p>
                    <p className="text-[9px] text-[var(--fm-text-muted)] uppercase tracking-wider">g/day</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {pieData.map((entry) => {
                  const pct = totalMacroGrams > 0 ? Math.round((entry.value / totalMacroGrams) * 100) : 0;
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-[var(--fm-text-secondary)]">{entry.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--fm-text-primary)]">{entry.value}g</span>
                      </div>
                      <div className="h-1.5 rounded-full glass-card overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: entry.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--fm-text-muted)] text-center py-6">
              No macro data yet. Start logging meals!
            </p>
          )}
        </motion.div>

        {/* ── 3. Most Eaten Foods ────────────────────────────────── */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-[var(--fm-text-primary)] flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[var(--fm-green)]" />
              Most Eaten Foods
            </h3>

            {/* Week / Month Toggle */}
            <div className="flex rounded-full glass-card overflow-hidden p-0.5">
              {(["week", "month"] as const).map((range) => (
                <motion.button
                  key={range}
                  onClick={() => setMostEatenRange(range)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    mostEatenRange === range
                      ? "bg-[var(--fm-green)] text-white shadow-sm"
                      : "text-[var(--fm-text-muted)] hover:text-[var(--fm-text-primary)]"
                  }`}
                  whileTap={{ scale: 0.92 }}
                >
                  {range === "week" ? "7 Days" : "30 Days"}
                </motion.button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[var(--fm-text-muted)] mb-4">
            Your favorites by time of day
          </p>

          {hasAnyMostEaten ? (
            <div className="space-y-3">
              {(Object.keys(MEAL_TIME_CONFIG) as MealTimeSlot[]).map((slot) => {
                const config = MEAL_TIME_CONFIG[slot];
                const item = mostEatenBySlot[slot];

                return (
                  <motion.div
                    key={slot}
                    className="glass-card p-3.5 rounded-xl flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {/* Thumbnail or Emoji */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: item.imageUrl
                          ? undefined
                          : "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.05) 100%)",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || "Food"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{config.emoji}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--fm-text-muted)] uppercase tracking-wider mb-0.5">
                        {config.label}
                      </p>
                      {item.count > 0 ? (
                        <>
                          <p className="text-sm font-bold text-[var(--fm-text-primary)] truncate">
                            {item.name}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--fm-text-muted)] italic">
                          No data yet
                        </p>
                      )}
                    </div>

                    {/* Frequency Badge */}
                    {item.count > 0 && (
                      <div className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                        style={{
                          background: "rgba(16,185,129,0.1)",
                          color: "var(--fm-green)",
                        }}
                      >
                        {item.count}x {rangeDaysLabel}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--fm-text-muted)] text-center py-6">
              Log more meals to discover your favorites!
            </p>
          )}
        </motion.div>
      </div>

      <Navbar />
    </motion.div>
  );
}

