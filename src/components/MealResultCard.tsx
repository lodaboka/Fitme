"use client";

// ============================================================
// Fit Me v3 — Meal Result Card (Liquid Glass Theme)
// Glass panels, animated checkmark, meal category dropdown,
// "Not sure?" quantity editor with live macro recalculation
// ============================================================

import { SnapResponse, MealCategory, FoodItem } from "@/lib/types";
import { Check, ChevronDown, Utensils, Sparkles, Minus, Plus, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MEAL_CATEGORIES, MEAL_CATEGORY_ICONS } from "@/lib/meal-categories";

interface MealResultCardProps {
  result: SnapResponse;
  imagePreview: string;
  onSaved: () => void;
  loggedCategory?: MealCategory;
  onCategoryChange?: (cat: MealCategory) => void;
  onItemsChange?: (items: FoodItem[]) => void;
}

export default function MealResultCard({
  result,
  imagePreview,
  onSaved,
  loggedCategory,
  onCategoryChange,
  onItemsChange,
}: MealResultCardProps) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showQuantityEditor, setShowQuantityEditor] = useState(false);
  const [editedItems, setEditedItems] = useState<FoodItem[]>(result.items);

  // Calculate totals from edited items
  const total_macros = useMemo(() => {
    return editedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.macros.calories,
        protein: acc.protein + item.macros.protein,
        carbs: acc.carbs + item.macros.carbs,
        fats: acc.fats + item.macros.fats,
        fiber: acc.fiber + item.macros.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [editedItems]);

  const items = editedItems;

  // Parse numeric quantity from string like "2", "1 bowl", "3 pieces"
  const parseQuantity = (q: string): number => {
    const match = q.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 1;
  };

  // Get the unit suffix from quantity (e.g., " bowl" from "1 bowl")
  const getUnit = (q: string): string => {
    const match = q.match(/^\d+(?:\.\d+)?\s*(.*)/);
    return match && match[1] ? ` ${match[1]}` : "";
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setEditedItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const originalQty = parseQuantity(result.items[index]?.quantity || "1");
      const currentQty = parseQuantity(item.quantity);
      const newQty = Math.max(0.5, currentQty + delta);
      const unit = getUnit(item.quantity);

      // Calculate per-unit macros based on original values
      const originalMacros = result.items[index]?.macros || item.macros;
      const perUnit = {
        calories: originalMacros.calories / originalQty,
        protein: originalMacros.protein / originalQty,
        carbs: originalMacros.carbs / originalQty,
        fats: originalMacros.fats / originalQty,
        fiber: originalMacros.fiber / originalQty,
      };

      item.quantity = `${newQty}${unit}`;
      item.macros = {
        calories: Math.round(perUnit.calories * newQty),
        protein: Math.round(perUnit.protein * newQty * 10) / 10,
        carbs: Math.round(perUnit.carbs * newQty * 10) / 10,
        fats: Math.round(perUnit.fats * newQty * 10) / 10,
        fiber: Math.round(perUnit.fiber * newQty * 10) / 10,
      };

      updated[index] = item;
      onItemsChange?.(updated);
      return updated;
    });
  };

  return (
    <motion.div
      className="w-full space-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Success Badge with animated checkmark */}
      <motion.div
        className="flex flex-col items-center gap-3 py-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Animated SVG checkmark */}
        <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 16l6 6 10-12"
              stroke="var(--fm-green)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-check"
            />
          </svg>
        </div>

        {/* Meal Category Badge with dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:shadow-md transition-all"
            whileTap={{ scale: 0.95 }}
            id="meal-category-dropdown-btn"
          >
            <Sparkles className="w-4 h-4 text-[var(--fm-green)]" />
            <span className="text-xs font-semibold text-[var(--fm-green-dark)]">
              Logged as {loggedCategory || "Meal"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--fm-text-muted)] transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`} />
          </motion.button>

          {/* Category Dropdown */}
          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 glass-panel rounded-2xl overflow-hidden shadow-xl z-20"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {MEAL_CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat}
                    onClick={() => {
                      onCategoryChange?.(cat);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      loggedCategory === cat
                        ? "bg-[var(--fm-green)]/10 text-[var(--fm-green-dark)] font-semibold"
                        : "text-[var(--fm-text-primary)] hover:bg-white/5"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-base">{MEAL_CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                    {loggedCategory === cat && (
                      <Check className="w-3.5 h-3.5 text-[var(--fm-green)] ml-auto" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Total Macros Card */}
      <motion.div
        className="glass-panel overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Image preview */}
        {imagePreview && (
          <div className="h-44 overflow-hidden relative">
            <img
              src={imagePreview}
              alt="Meal"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        <div className="p-5">
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-[var(--fm-green)]" />
            Total Nutrition
          </h3>

          {/* Macro grid */}
          <div className="grid grid-cols-4 gap-2.5">
            <MacroBox
              label="Calories"
              value={total_macros.calories}
              unit="kcal"
              color="var(--fm-green)"
            />
            <MacroBox
              label="Protein"
              value={total_macros.protein}
              unit="g"
              color="var(--fm-protein)"
            />
            <MacroBox
              label="Carbs"
              value={total_macros.carbs}
              unit="g"
              color="var(--fm-carbs)"
            />
            <MacroBox
              label="Fats"
              value={total_macros.fats}
              unit="g"
              color="var(--fm-fats)"
            />
          </div>

          {/* "Not sure?" quantity editor toggle */}
          <motion.button
            onClick={() => setShowQuantityEditor(!showQuantityEditor)}
            className="mt-4 flex items-center gap-1.5 text-xs text-[var(--fm-text-muted)] hover:text-[var(--fm-green)] transition-colors"
            whileTap={{ scale: 0.97 }}
            id="edit-quantities-btn"
          >
            <Pencil className="w-3 h-3" />
            {showQuantityEditor ? "Hide editor" : "Not sure about the meal? Edit items →"}
          </motion.button>

          {/* Quantity Editor Panel */}
          <AnimatePresence>
            {showQuantityEditor && (
              <motion.div
                className="mt-3 space-y-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {editedItems.map((item, index) => (
                  <div
                    key={index}
                    className="glass-card p-3 rounded-xl flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--fm-text-primary)] truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[var(--fm-text-muted)]">
                        {Math.round(item.macros.calories)} kcal
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => handleQuantityChange(index, -1)}
                        className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-[var(--fm-text-primary)] hover:bg-white/10 transition-colors"
                        whileTap={{ scale: 0.85 }}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </motion.button>
                      <span className="text-sm font-bold text-[var(--fm-text-primary)] w-12 text-center">
                        {item.quantity}
                      </span>
                      <motion.button
                        onClick={() => handleQuantityChange(index, 1)}
                        className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-[var(--fm-text-primary)] hover:bg-white/10 transition-colors"
                        whileTap={{ scale: 0.85 }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Individual Food Items */}
      <motion.div
        className="glass-panel p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 30 }}
      >
        <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-4 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[var(--fm-green)]" />
          Items Detected ({items.length})
        </h3>

        <div className="space-y-2.5">
          {items.map((item, index) => {
            const isExpanded = expandedItem === index;

            return (
              <motion.div
                key={index}
                className="glass-card overflow-hidden"
                layout
              >
                <motion.button
                  onClick={() =>
                    setExpandedItem(isExpanded ? null : index)
                  }
                  className="w-full flex items-center gap-3 p-3.5 min-h-[48px] hover:bg-white/5 transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                  id={`meal-item-${index}`}
                >
                  <div className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-xs font-bold text-[var(--fm-green)] shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[var(--fm-text-muted)]">
                      {item.quantity} · {item.macros.calories} kcal
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[var(--fm-text-muted)]" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5 space-y-2.5">
                        <div className="grid grid-cols-4 gap-2.5">
                          <MiniMacro
                            label="Protein"
                            value={item.macros.protein}
                            color="var(--fm-protein)"
                          />
                          <MiniMacro
                            label="Carbs"
                            value={item.macros.carbs}
                            color="var(--fm-carbs)"
                          />
                          <MiniMacro
                            label="Fats"
                            value={item.macros.fats}
                            color="var(--fm-fats)"
                          />
                          <MiniMacro
                            label="Fiber"
                            value={item.macros.fiber}
                            color="var(--fm-fiber)"
                          />
                        </div>
                        {item.ingredients.length > 0 && (
                          <p className="text-[10px] text-[var(--fm-text-muted)]">
                            <span className="font-medium">Ingredients:</span>{" "}
                            {item.ingredients.join(", ")}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Done button */}
      <motion.button
        onClick={onSaved}
        className="w-full h-14 min-h-[48px] rounded-full btn-green flex items-center justify-center gap-2 text-sm"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        id="snap-goto-dashboard-btn"
      >
        <Check className="w-4 h-4" />
        Log Meal
      </motion.button>
    </motion.div>
  );
}

function MacroBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <motion.div
      className="text-center p-2.5 rounded-2xl glass-card"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <p
        className="text-sm font-bold animate-count-up"
        style={{ color, fontFamily: "var(--font-heading)" }}
      >
        {Math.round(value)}
      </p>
      <p className="text-[9px] text-[var(--fm-text-muted)] mt-0.5">
        {unit} {label}
      </p>
    </motion.div>
  );
}

function MiniMacro({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center p-1.5 rounded-xl glass-card">
      <p className="text-xs font-semibold" style={{ color }}>
        {Math.round(value)}g
      </p>
      <p className="text-[9px] text-[var(--fm-text-muted)]">{label}</p>
    </div>
  );
}
