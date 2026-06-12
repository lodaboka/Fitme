"use client";

// ============================================================
// Fit Me v2 — Meal Timeline Component
// Displays logged meals with thumbnails and clickable interactive modals
// ============================================================

import { FoodLog, MealCategory } from "@/lib/types";
import { Camera, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface MealTimelineProps {
  logs: FoodLog[];
  selectedMealType?: MealCategory | "all";
}

const MEAL_TABS: { label: string; value: MealCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Breakfast", value: "Breakfast" },
  { label: "Lunch", value: "Lunch" },
  { label: "Dinner", value: "Dinner" },
];

export default function MealTimeline({
  logs,
  selectedMealType = "all",
}: MealTimelineProps) {
  const [selectedMeal, setSelectedMeal] = useState<FoodLog | null>(null);

  // Filter logic: compares stored category to active filter state.
  // Note: "all" displays everything.
  const filteredLogs =
    selectedMealType === "all"
      ? logs
      : logs.filter((l) => l.meal_category === selectedMealType);

  if (filteredLogs.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[var(--fm-green-bg)] flex items-center justify-center mx-auto mb-3">
          <Camera className="w-7 h-7 text-[var(--fm-green)]" />
        </div>
        <p className="text-sm font-medium text-[var(--fm-text-primary)]">
          No meals logged yet
        </p>
        <p className="text-xs text-[var(--fm-text-muted)] mt-1">
          Snap a photo to start tracking
        </p>
        <Link
          href="/snap"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full btn-green text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Meal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredLogs.map((log, index) => (
        <div
          key={log.id}
          onClick={() => setSelectedMeal(log)}
          className="card-elevated p-3 flex gap-3 animate-slide-up cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
            {log.image_url ? (
              <img
                src={log.image_url}
                alt="Food"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Camera className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 pr-2">
                <h4 className="text-sm font-semibold text-[var(--fm-text-primary)] truncate">
                  {log.items_json?.[0]?.name || log.meal_category}
                </h4>
                <p className="text-[11px] text-[var(--fm-text-muted)] mt-0.5 truncate">
                  {log.meal_category} · {Math.round(log.total_calories)} kcal
                </p>
              </div>
              <span className="text-[10px] text-[var(--fm-text-muted)] shrink-0 mt-0.5">
                {new Date(log.logged_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>

            {/* Macro pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              <MacroPill
                label="Protein"
                value={Math.round(log.total_protein)}
                color="var(--fm-protein)"
              />
              <MacroPill
                label="Fats"
                value={Math.round(log.total_fats)}
                color="var(--fm-fats)"
              />
              <MacroPill
                label="Carbs"
                value={Math.round(log.total_carbs)}
                color="var(--fm-carbs)"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Detail Modal for Clickable Cards */}
      {selectedMeal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 animate-fade-in" 
          onClick={() => setSelectedMeal(null)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-[var(--fm-text-primary)] truncate pr-4">
                {selectedMeal.items_json?.[0]?.name || selectedMeal.meal_category}
              </h3>
              <button 
                onClick={() => setSelectedMeal(null)} 
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-3xl font-bold text-[var(--fm-green)]">
                    {Math.round(selectedMeal.total_calories)}
                  </p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                    {selectedMeal.meal_category}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedMeal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {/* Recharts Pie Chart */}
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Protein", value: selectedMeal.total_protein || 0, color: "var(--fm-protein)" },
                        { name: "Carbs", value: selectedMeal.total_carbs || 0, color: "var(--fm-carbs)" },
                        { name: "Fats", value: selectedMeal.total_fats || 0, color: "var(--fm-fats)" }
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {
                        [
                          { color: "var(--fm-protein)" },
                          { color: "var(--fm-carbs)" },
                          { color: "var(--fm-fats)" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value)}g`, ""]} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--fm-text-primary)', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-gray-400 uppercase">Macros</span>
                  </div>
                </div>
              </div>

              {/* Macro Legend */}
              <div className="flex justify-between items-center mt-6 bg-gray-50 rounded-2xl p-4">
                <div className="text-center flex-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--fm-protein)] mx-auto mb-1.5 shadow-sm"></div>
                  <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_protein)}g</p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">Protein</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center flex-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--fm-carbs)] mx-auto mb-1.5 shadow-sm"></div>
                  <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_carbs)}g</p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">Carbs</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center flex-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--fm-fats)] mx-auto mb-1.5 shadow-sm"></div>
                  <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_fats)}g</p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">Fats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] font-medium text-[var(--fm-text-muted)]">
        {value}g {label.charAt(0)}
      </span>
    </div>
  );
}
