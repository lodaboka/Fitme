"use client";

// ============================================================
// Fit Me v2 — Height Picker Component
// Supports cm OR feet/inches with toggle
// ============================================================

import { useState } from "react";
import { feetInchesToCm, cmToFeetInches } from "@/lib/calculations";
import type { HeightUnit } from "@/lib/types";

interface HeightPickerProps {
  heightCm: number;
  heightFt: number;
  heightIn: number;
  unit: HeightUnit;
  onCmChange: (cm: number) => void;
  onFtInChange: (ft: number, inch: number) => void;
  onUnitChange: (unit: HeightUnit) => void;
}

export default function HeightPicker({
  heightCm,
  heightFt,
  heightIn,
  unit,
  onCmChange,
  onFtInChange,
  onUnitChange,
}: HeightPickerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleUnitToggle = (newUnit: HeightUnit) => {
    if (newUnit === unit) return;
    if (newUnit === "ft" && heightCm > 0) {
      const { feet, inches } = cmToFeetInches(heightCm);
      onFtInChange(feet, inches);
    } else if (newUnit === "cm" && (heightFt > 0 || heightIn > 0)) {
      onCmChange(feetInchesToCm(heightFt, heightIn));
    }
    onUnitChange(newUnit);
  };

  const displayHeight = () => {
    if (unit === "cm") {
      return `${heightCm}`;
    }
    return `${heightFt}'${heightIn}"`;
  };

  return (
    <div className="space-y-4">
      {/* Label & Unit Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--fm-text-secondary)]">
          Height
        </span>
        <div className="flex bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => handleUnitToggle("cm")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              unit === "cm"
                ? "bg-[var(--fm-green)] text-white shadow-sm"
                : "text-[var(--fm-text-muted)]"
            }`}
          >
            cm
          </button>
          <button
            onClick={() => handleUnitToggle("ft")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              unit === "ft"
                ? "bg-[var(--fm-green)] text-white shadow-sm"
                : "text-[var(--fm-text-muted)]"
            }`}
          >
            ft/in
          </button>
        </div>
      </div>

      {/* Height Display / Input */}
      <div className="flex flex-col items-center">
        {/* Visual height bar */}
        <div className="relative w-full max-w-xs mb-6">
          <div className="h-48 flex items-end justify-center relative">
            {/* Height bar */}
            <div className="relative w-12 bg-gray-100 rounded-t-xl overflow-hidden" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--fm-green)] to-[var(--fm-green-light)] rounded-t-xl transition-all duration-500"
                style={{
                  height: `${Math.min(((unit === "cm" ? heightCm : feetInchesToCm(heightFt, heightIn)) / 220) * 100, 100)}%`,
                }}
              />
            </div>

            {/* Height markings */}
            <div className="absolute right-8 top-0 bottom-0 flex flex-col justify-between py-2">
              {(unit === "cm"
                ? [220, 180, 150, 120]
                : ["7'0\"", "5'11\"", "4'11\"", "3'11\""]
              ).map((mark, i) => (
                <span key={i} className="text-[10px] text-[var(--fm-text-muted)]">
                  {mark}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Input fields */}
        {unit === "cm" ? (
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              value={heightCm || ""}
              onChange={(e) => onCmChange(Number(e.target.value) || 0)}
              placeholder="170"
              className="w-24 text-center text-4xl font-bold text-[var(--fm-text-primary)] bg-transparent border-b-2 border-[var(--fm-green)] outline-none"
              style={{ fontFamily: "var(--font-heading)" }}
            />
            <span className="text-lg text-[var(--fm-text-muted)]">cm</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={heightFt || ""}
                onChange={(e) => onFtInChange(Number(e.target.value) || 0, heightIn)}
                placeholder="5"
                className="w-16 text-center text-4xl font-bold text-[var(--fm-text-primary)] bg-transparent border-b-2 border-[var(--fm-green)] outline-none"
                style={{ fontFamily: "var(--font-heading)" }}
                min={0}
                max={8}
              />
              <span className="text-lg text-[var(--fm-text-muted)]">ft</span>
            </div>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={heightIn || ""}
                onChange={(e) => onFtInChange(heightFt, Number(e.target.value) || 0)}
                placeholder="8"
                className="w-16 text-center text-4xl font-bold text-[var(--fm-text-primary)] bg-transparent border-b-2 border-[var(--fm-green)] outline-none"
                style={{ fontFamily: "var(--font-heading)" }}
                min={0}
                max={11}
              />
              <span className="text-lg text-[var(--fm-text-muted)]">in</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
