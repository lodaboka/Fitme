"use client";

// ============================================================
// Fit Me v3 — Meal Timeline (Liquid Glass Theme)
// Glass cards with Framer Motion stagger + animated modal
// Now with delete functionality & AnimatePresence exit
// ============================================================

import { FoodLog, MealCategory } from "@/lib/types";
import { Camera, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { createClient } from "@/lib/supabase/client";

interface MealTimelineProps {
  logs: FoodLog[];
  selectedMealType?: MealCategory | "all";
  onDelete?: (logId: string) => void;
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
  onDelete,
}: MealTimelineProps) {
  const [selectedMeal, setSelectedMeal] = useState<FoodLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filter logic
  const filteredLogs =
    selectedMealType === "all"
      ? logs
      : logs.filter((l) => l.meal_category === selectedMealType);

  const handleDeleteClick = (e: React.MouseEvent, log: FoodLog) => {
    e.stopPropagation();
    setDeleteTarget(log);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      // Notify parent to remove from state
      onDelete?.(deleteTarget.id);
      setDeleteTarget(null);

      // Show toast
      setToast("Meal deleted");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Delete failed:", err);
      setToast("Failed to delete");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setDeleting(false);
    }
  };

  if (filteredLogs.length === 0) {
    return (
      <motion.div
        className="text-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mx-auto mb-3">
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
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={log.id}
            layout
            onClick={() => setSelectedMeal(log)}
            className="glass-panel p-3 flex gap-3 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, padding: 0, overflow: "hidden" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.05,
            }}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 glass-card">
              {log.image_url ? (
                <img
                  src={log.image_url}
                  alt="Food"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--fm-text-muted)]">
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
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className="text-[10px] text-[var(--fm-text-muted)]">
                    {new Date(log.logged_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  {/* Delete button */}
                  <motion.button
                    onClick={(e) => handleDeleteClick(e, log)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-red-500/10 transition-all duration-200"
                    whileTap={{ scale: 0.85 }}
                    id={`delete-meal-${log.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </motion.button>
                </div>
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
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              className="relative glass-panel w-full max-w-xs p-6 rounded-3xl shadow-2xl text-center"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Red icon */}
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
              >
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>

              <h3 className="text-base font-bold text-[var(--fm-text-primary)] mb-1">
                Delete this meal?
              </h3>
              <p className="text-xs text-[var(--fm-text-muted)] mb-5">
                {deleteTarget.items_json?.[0]?.name || deleteTarget.meal_category} · {Math.round(deleteTarget.total_calories)} kcal
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-full glass-card text-sm font-semibold text-[var(--fm-text-primary)] hover:shadow-md transition-all disabled:opacity-50"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {deleting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
                  ) : (
                    "Delete"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal with AnimatePresence */}
      <AnimatePresence>
        {selectedMeal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMeal(null)}
          >
            {/* Glass backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal content */}
            <motion.div
              className="relative glass-panel w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-[var(--fm-text-primary)] truncate pr-4">
                  {selectedMeal.items_json?.[0]?.name || selectedMeal.meal_category}
                </h3>
                <motion.button
                  onClick={() => setSelectedMeal(null)}
                  className="p-1.5 rounded-full glass-card text-[var(--fm-text-muted)] hover:text-[var(--fm-text-primary)] transition-colors"
                  whileTap={{ scale: 0.85 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 pb-28 sm:pb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-3xl font-bold text-[var(--fm-green)]">
                      {Math.round(selectedMeal.total_calories)}
                    </p>
                    <p className="text-xs font-bold text-[var(--fm-text-secondary)] uppercase tracking-wider">Calories</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--fm-text-primary)]">
                      {selectedMeal.meal_category}
                    </p>
                    <p className="text-xs font-semibold text-[var(--fm-text-secondary)] mt-0.5">
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
                        formatter={(value: any) => [`${Math.round(Number(value || 0))}g`, ""]}
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        itemStyle={{ color: 'var(--fm-text-primary)', fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text in donut */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-[11px] font-bold text-[var(--fm-text-secondary)] uppercase tracking-wider">Macros</span>
                    </div>
                  </div>
                </div>

                {/* Macro Legend — glass-styled */}
                <div className="flex justify-between items-center mt-6 glass-card p-4">
                  <div className="text-center flex-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--fm-protein)] mx-auto mb-1.5 shadow-sm"></div>
                    <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_protein)}g</p>
                    <p className="text-[10px] font-bold text-[var(--fm-text-secondary)] uppercase">Protein</p>
                  </div>
                  <div className="w-px h-8 bg-white/15"></div>
                  <div className="text-center flex-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--fm-carbs)] mx-auto mb-1.5 shadow-sm"></div>
                    <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_carbs)}g</p>
                    <p className="text-[10px] font-bold text-[var(--fm-text-secondary)] uppercase">Carbs</p>
                  </div>
                  <div className="w-px h-8 bg-white/15"></div>
                  <div className="text-center flex-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--fm-fats)] mx-auto mb-1.5 shadow-sm"></div>
                    <p className="text-base font-bold text-[var(--fm-text-primary)]">{Math.round(selectedMeal.total_fats)}g</p>
                    <p className="text-[10px] font-bold text-[var(--fm-text-secondary)] uppercase">Fats</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-28 left-1/2 z-[80] glass-panel px-5 py-3 rounded-full shadow-lg"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
              {toast === "Meal deleted" ? "✓ " : "✗ "}{toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="flex items-center gap-1.5 glass-card px-2 py-1 rounded-md !rounded-lg">
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
