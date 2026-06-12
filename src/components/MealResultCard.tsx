"use client";

// ============================================================
// Fit Me v2 — Meal Result Card (White/Green Theme)
// Shows AI analysis results with food thumbnail and macros
// ============================================================

import { SnapResponse, MealCategory } from "@/lib/types";
import { Check, ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { useState } from "react";

interface MealResultCardProps {
  result: SnapResponse;
  imagePreview: string;
  onSaved: () => void;
  loggedCategory?: MealCategory;
}

export default function MealResultCard({
  result,
  imagePreview,
  onSaved,
  loggedCategory,
}: MealResultCardProps) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const { items, total_macros } = result;

  return (
    <div className="w-full space-y-4 animate-slide-up">
      {/* Success Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--fm-green-bg)] w-fit mx-auto">
        <Check className="w-4 h-4 text-[var(--fm-green)]" />
        <span className="text-xs font-medium text-[var(--fm-green-dark)]">
          Logged as {loggedCategory || "Meal"}
        </span>
      </div>

      {/* Total Macros Card */}
      <div className="card-elevated overflow-hidden">
        {/* Image preview */}
        {imagePreview && (
          <div className="h-40 overflow-hidden">
            <img
              src={imagePreview}
              alt="Meal"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-sm font-semibold text-[var(--fm-text-primary)] mb-3">
            Total Nutrition
          </h3>

          {/* Macro grid */}
          <div className="grid grid-cols-4 gap-2">
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
        </div>
      </div>

      {/* Individual Food Items */}
      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-[var(--fm-text-primary)] mb-3">
          <Utensils className="w-4 h-4 inline mr-1.5 text-[var(--fm-green)]" />
          Items Detected ({items.length})
        </h3>

        <div className="space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItem === index;

            return (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedItem(isExpanded ? null : index)
                  }
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--fm-green-bg)] flex items-center justify-center text-xs font-bold text-[var(--fm-green)]">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[var(--fm-text-primary)]">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[var(--fm-text-muted)]">
                      {item.quantity} · {item.macros.calories} kcal
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 animate-fade-in">
                    <div className="grid grid-cols-4 gap-2">
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onSaved}
        className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
      >
        <Check className="w-4 h-4" />
        Go to Dashboard
      </button>
    </div>
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
    <div className="text-center p-2 rounded-xl" style={{ backgroundColor: `${color}10` }}>
      <p className="text-sm font-bold" style={{ color, fontFamily: "var(--font-heading)" }}>
        {Math.round(value)}
      </p>
      <p className="text-[9px] text-[var(--fm-text-muted)]">
        {unit} {label}
      </p>
    </div>
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
    <div className="text-center">
      <p className="text-xs font-semibold" style={{ color }}>
        {Math.round(value)}g
      </p>
      <p className="text-[9px] text-[var(--fm-text-muted)]">{label}</p>
    </div>
  );
}
