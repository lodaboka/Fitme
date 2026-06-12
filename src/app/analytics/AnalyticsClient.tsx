"use client";

// ============================================================
// Fit Me v2 — Analytics Client Component
// Recharts-based calorie trends, macro breakdown
// Matches mockup screens 13 & 17
// ============================================================

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
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
} from "recharts";
import { Profile, FoodLog, ChartDataPoint } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { ArrowLeft, TrendingUp, Flame, Drumstick } from "lucide-react";
import Link from "next/link";

interface AnalyticsClientProps {
  profile: Profile;
  logs: FoodLog[];
}

type TimeFilter = "week" | "month";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsClient({ profile, logs }: AnalyticsClientProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  // Aggregate logs by date
  const chartData: ChartDataPoint[] = useMemo(() => {
    const days = timeFilter === "week" ? 7 : 30;
    const data: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at).toISOString().split("T")[0];
        return logDate === dateStr;
      });

      const totals = dayLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + (log.total_calories || 0),
          protein: acc.protein + (log.total_protein || 0),
          carbs: acc.carbs + (log.total_carbs || 0),
          fats: acc.fats + (log.total_fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      data.push({
        date: dateStr,
        label: timeFilter === "week"
          ? DAY_LABELS[d.getDay()]
          : `${d.getMonth() + 1}/${d.getDate()}`,
        ...totals,
      });
    }

    return data;
  }, [logs, timeFilter]);

  // Totals for pie chart
  const periodTotals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fats: acc.fats + d.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [chartData]);

  const pieData = [
    { name: "Protein", value: periodTotals.protein, color: "var(--fm-protein)" },
    { name: "Carbs", value: periodTotals.carbs, color: "var(--fm-carbs)" },
    { name: "Fats", value: periodTotals.fats, color: "var(--fm-fats)" },
  ].filter((d) => d.value > 0);

  const avgCalories = chartData.length > 0
    ? Math.round(periodTotals.calories / chartData.filter((d) => d.calories > 0).length || 1)
    : 0;

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
        <h1
          className="text-xl font-bold text-[var(--fm-text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Analytics
        </h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Time Filter Tabs */}
        <div className="flex bg-gray-100 rounded-full p-1">
          {(["week", "month"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                timeFilter === filter
                  ? "bg-white text-[var(--fm-text-primary)] shadow-sm"
                  : "text-[var(--fm-text-muted)]"
              }`}
            >
              {filter === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--fm-green-bg)] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[var(--fm-green)]" />
              </div>
              <span className="text-xs text-[var(--fm-text-muted)]">Avg Daily</span>
            </div>
            <p className="text-2xl font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              {avgCalories}
            </p>
            <p className="text-xs text-[var(--fm-text-muted)]">kcal / day</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B6B]/10 flex items-center justify-center">
                <Drumstick className="w-4 h-4 text-[#FF6B6B]" />
              </div>
              <span className="text-xs text-[var(--fm-text-muted)]">Total Protein</span>
            </div>
            <p className="text-2xl font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              {Math.round(periodTotals.protein)}
            </p>
            <p className="text-xs text-[var(--fm-text-muted)]">grams</p>
          </div>
        </div>

        {/* Calorie Trend Line Chart */}
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-[var(--fm-text-primary)] mb-4">
            <TrendingUp className="w-4 h-4 inline mr-1.5 text-[var(--fm-green)]" />
            Calorie Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#4CAF50"
                strokeWidth={2.5}
                dot={{ fill: "#4CAF50", r: 3 }}
                activeDot={{ r: 6, fill: "#4CAF50" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Bar Chart */}
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-[var(--fm-text-primary)] mb-4">
            Macro Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="protein" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="carbs" fill="#FFB946" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fats" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
              <span className="text-[10px] text-[var(--fm-text-muted)]">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFB946]" />
              <span className="text-[10px] text-[var(--fm-text-muted)]">Carbs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4ECDC4]" />
              <span className="text-[10px] text-[var(--fm-text-muted)]">Fats</span>
            </div>
          </div>
        </div>

        {/* Macro Distribution Pie */}
        {pieData.length > 0 && (
          <div className="card-elevated p-4">
            <h3 className="text-sm font-semibold text-[var(--fm-text-primary)] mb-4">
              Macro Distribution
            </h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((entry) => {
                  const total = pieData.reduce((s, e) => s + e.value, 0);
                  const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-[var(--fm-text-secondary)]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--fm-text-primary)]">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
