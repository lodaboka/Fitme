"use client";

// ============================================================
// Fit Me v2.1 — Macro Card Component (Premium)
// Rounded-2xl cards with soft shadows, animated progress bars
// ============================================================

import { useEffect, useState } from "react";

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
  icon: React.ReactNode;
}

export default function MacroCard({
  label,
  current,
  goal,
  unit = "g",
  color,
  icon,
}: MacroCardProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isExceeded = current > goal;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="card-elevated p-4 flex-1 min-w-[100px]">
      {/* Icon & Label */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-xs font-semibold text-[var(--fm-text-secondary)]">
          {label}
        </span>
      </div>

      {/* Values */}
      <div className="flex items-baseline gap-1 mb-3">
        <span
          className="text-xl font-bold"
          style={{
            color: isExceeded ? "var(--destructive)" : "var(--fm-text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {Math.round(current)}
        </span>
        <span className="text-[10px] text-[var(--fm-text-muted)]">
          /{goal}{unit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: isExceeded ? "var(--destructive)" : color,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
