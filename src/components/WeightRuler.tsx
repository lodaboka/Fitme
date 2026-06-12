"use client";

// ============================================================
// Fit Me v2 — Weight Ruler Component
// Horizontal draggable ruler slider for weight selection
// Shows weight in digits but also allows manual typing
// Supports Kg / Lbs toggle
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { kgToLbs, lbsToKg } from "@/lib/calculations";
import type { WeightUnit } from "@/lib/types";

interface WeightRulerProps {
  value: number;           // Always stored in kg
  onChange: (valueKg: number) => void;
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  min?: number;            // In current unit
  max?: number;            // In current unit
  label?: string;
}

export default function WeightRuler({
  value,
  onChange,
  unit,
  onUnitChange,
  min: minProp,
  max: maxProp,
  label = "Weight",
}: WeightRulerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const rulerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  // Convert display value based on unit
  const displayValue = unit === "kg" ? value : kgToLbs(value);
  const min = minProp || (unit === "kg" ? 30 : 66);
  const max = maxProp || (unit === "kg" ? 200 : 440);
  const step = unit === "kg" ? 0.5 : 1;

  // Create ruler marks
  const marks: number[] = [];
  for (let i = min; i <= max; i += step) {
    marks.push(Math.round(i * 10) / 10);
  }

  const handleValueFromDisplay = (displayVal: number) => {
    const clamped = Math.max(min, Math.min(max, displayVal));
    const inKg = unit === "kg" ? clamped : lbsToKg(clamped);
    onChange(Math.round(inKg * 10) / 10);
  };

  // Drag handling
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startValue.current = displayValue;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [displayValue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = startX.current - e.clientX;
    const sensitivity = unit === "kg" ? 0.15 : 0.3;
    const delta = dx * sensitivity;
    const newVal = Math.round((startValue.current + delta) / step) * step;
    handleValueFromDisplay(newVal);
  }, [unit, step]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Manual input
  const startEditing = () => {
    setEditValue(displayValue.toString());
    setIsEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      handleValueFromDisplay(parsed);
    }
    setIsEditing(false);
  };

  // Scroll ruler to center on value
  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler || isDragging.current) return;
    const index = marks.findIndex((m) => Math.abs(m - displayValue) < step);
    if (index >= 0) {
      const markWidth = 8;
      const scrollTarget = index * markWidth - ruler.clientWidth / 2;
      ruler.scrollLeft = Math.max(0, scrollTarget);
    }
  }, [displayValue, marks, step]);

  return (
    <div className="space-y-4">
      {/* Label & Unit Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--fm-text-secondary)]">
          {label}
        </span>
        <div className="flex bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => onUnitChange("kg")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              unit === "kg"
                ? "bg-[var(--fm-green)] text-white shadow-sm"
                : "text-[var(--fm-text-muted)]"
            }`}
          >
            Kg
          </button>
          <button
            onClick={() => onUnitChange("lbs")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              unit === "lbs"
                ? "bg-[var(--fm-green)] text-white shadow-sm"
                : "text-[var(--fm-text-muted)]"
            }`}
          >
            Lbs
          </button>
        </div>
      </div>

      {/* Display Value (tap to edit) */}
      <div className="flex items-center justify-center">
        {isEditing ? (
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === "Enter" && commitEdit()}
              className="w-24 text-center text-4xl font-bold text-[var(--fm-text-primary)] bg-transparent border-b-2 border-[var(--fm-green)] outline-none"
              style={{ fontFamily: "var(--font-heading)" }}
              autoFocus
            />
            <span className="text-lg text-[var(--fm-text-muted)]">{unit}</span>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="flex items-baseline gap-2 group"
          >
            <span
              className="text-5xl font-bold text-[var(--fm-text-primary)] group-hover:text-[var(--fm-green)] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {displayValue.toFixed(unit === "kg" ? 1 : 0)}
            </span>
            <span className="text-lg text-[var(--fm-text-muted)]">{unit}</span>
          </button>
        )}
      </div>

      {/* Ruler */}
      <div className="relative h-16">
        {/* Center indicator (triangle) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[var(--fm-green)]" />
        </div>

        {/* Draggable ruler area */}
        <div
          className="h-full flex items-end justify-center cursor-grab active:cursor-grabbing touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Ruler marks visualization */}
          <div className="flex items-end gap-[1px] select-none" ref={rulerRef}>
            {marks.map((mark, i) => {
              const isMajor = mark % (unit === "kg" ? 5 : 10) === 0;
              const isSelected = Math.abs(mark - displayValue) < step / 2;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  style={{ minWidth: "8px" }}
                >
                  <div
                    className={`w-[2px] rounded-full transition-all duration-150 ${
                      isSelected
                        ? "bg-[var(--fm-green)] h-10"
                        : isMajor
                        ? "bg-gray-300 h-8"
                        : "bg-gray-200 h-4"
                    }`}
                  />
                  {isMajor && (
                    <span
                      className={`text-[8px] mt-0.5 ${
                        isSelected
                          ? "text-[var(--fm-green)] font-bold"
                          : "text-[var(--fm-text-muted)]"
                      }`}
                    >
                      {mark}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => handleValueFromDisplay(displayValue - step)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[var(--fm-text-muted)] hover:bg-gray-200 transition-colors text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={() => handleValueFromDisplay(displayValue + step)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[var(--fm-text-muted)] hover:bg-gray-200 transition-colors text-lg font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
