"use client";

// ============================================================
// Fit Me v3 — Analytics Client (Liquid Glass Theme)
// 4 premium glassmorphic visualizations:
// 1. Calorie Goal Adherence (line chart with target baseline)
// 2. Macro Balance Score (donut chart)
// 3. Weight Trend (line chart)
// 4. AI Insights Card (rule-based)
// ============================================================

import { useMemo, useState, useEffect } from "react";
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
import { ArrowLeft, TrendingUp, Target, Brain, PieChart as PieIcon } from "lucide-react";
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

export default function AnalyticsClient({ profile, logs }: AnalyticsClientProps) {
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

  // ── AI Insights (Gemini-powered, cached daily) ────────────
  const [insight, setInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      // Check localStorage cache — only fetch once per day
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = "fitme_ai_insight";
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.text) {
            setInsight(parsed.text);
            setInsightLoading(false);
            return;
          }
        } catch {
          // Invalid cache, refetch
        }
      }

      // Fetch fresh insight from Gemini
      try {
        const res = await fetch("/api/insights", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          const text = data.insight || "Keep tracking your meals for insights! 💪";
          setInsight(text);
          // Cache with today's date
          localStorage.setItem(cacheKey, JSON.stringify({ date: today, text }));
        } else {
          setInsight("Keep tracking your meals for insights! 💪");
        }
      } catch {
        setInsight("Keep tracking your meals for insights! 💪");
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
  }, []);

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

        {/* ── 3. Weight Trend ──────────────────────────────────── */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--fm-fats)]" />
            Weight Progress
          </h3>
          <p className="text-[10px] text-[var(--fm-text-muted)] mb-4">
            Current vs Target weight
          </p>

          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <p
                className="text-3xl font-bold text-[var(--fm-text-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {profile.current_weight_kg || "—"}
              </p>
              <p className="text-[10px] text-[var(--fm-text-muted)] mt-1 uppercase tracking-wider">Current kg</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-px bg-[var(--fm-green)]/30" />
              <span className="text-[9px] text-[var(--fm-green)] font-semibold uppercase">
                {profile.goal === "lose" ? "↓ Losing" : profile.goal === "gain" ? "↑ Gaining" : "= Maintain"}
              </span>
              <div className="w-12 h-px bg-[var(--fm-green)]/30" />
            </div>
            <div className="text-center">
              <p
                className="text-3xl font-bold text-[var(--fm-green)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {profile.target_weight_kg || "—"}
              </p>
              <p className="text-[10px] text-[var(--fm-text-muted)] mt-1 uppercase tracking-wider">Target kg</p>
            </div>
          </div>

          {/* Progress bar */}
          {profile.current_weight_kg && profile.target_weight_kg && (
            <div className="mt-2">
              <div className="h-2 rounded-full glass-card overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--fm-green)] to-[var(--fm-green-light)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      profile.goal === "lose"
                        ? ((profile.current_weight_kg - profile.target_weight_kg) /
                            (profile.current_weight_kg - profile.target_weight_kg + 0.01)) *
                            100 || 50
                        : ((profile.target_weight_kg - profile.current_weight_kg) /
                            (profile.target_weight_kg - profile.current_weight_kg + 0.01)) *
                            100 || 50
                    )}%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[var(--fm-text-muted)]">Start</span>
                <span className="text-[9px] text-[var(--fm-text-muted)]">Goal</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── 4. AI Insights Card ─────────────────────────────── */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[var(--fm-fiber)]" />
            AI Insight
            <span className="text-[9px] text-[var(--fm-text-muted)] font-normal ml-auto">Powered by Gemini</span>
          </h3>
          <div className="glass-card p-4 rounded-xl">
            {insightLoading ? (
              <div className="space-y-2">
                <div className="h-3 glass-skeleton w-full rounded-full" />
                <div className="h-3 glass-skeleton w-3/4 rounded-full" />
              </div>
            ) : (
              <p className="text-sm text-[var(--fm-text-secondary)] leading-relaxed">
                {insight}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <Navbar />
    </motion.div>
  );
}
