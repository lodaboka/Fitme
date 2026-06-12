"use client";

// ============================================================
// Fit Me — Apple-Style Activity Rings Component
// Concentric SVG rings for Calories, Protein, and Fats progress
// ============================================================

import { useEffect, useState } from "react";
import { calcProgress } from "@/lib/utils";

interface RingProps {
  calories: number;
  protein: number;
  fats: number;
  caloriesGoal: number;
  proteinGoal: number;
  fatsGoal: number;
}

interface SingleRingProps {
  radius: number;
  strokeWidth: number;
  progress: number; // 0-100
  gradientId: string;
  color1: string;
  color2: string;
  delay: number;
}

function SingleRing({
  radius,
  strokeWidth,
  progress,
  gradientId,
  color1,
  color2,
  delay,
}: SingleRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.min(progress, 100));
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay]);

  return (
    <>
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <filter id={`glow-${gradientId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/5"
      />

      {/* Progress ring */}
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        filter={`url(#glow-${gradientId})`}
        className="transition-all duration-1000 ease-out"
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
        }}
      />

      {/* Cap glow at the end of the ring */}
      {animatedProgress > 5 && (
        <circle
          cx="50%"
          cy="50%"
          r={strokeWidth / 3}
          fill={color2}
          className="opacity-60"
          style={{
            transform: `rotate(${
              -90 + (animatedProgress / 100) * 360
            }deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 1s ease-out",
            // Position at the end of the ring
            cx: `calc(50%)`,
            cy: `calc(50% - ${radius}px)`,
          }}
        />
      )}
    </>
  );
}

export default function ActivityRings({
  calories,
  protein,
  fats,
  caloriesGoal,
  proteinGoal,
  fatsGoal,
}: RingProps) {
  const caloriesProgress = calcProgress(calories, caloriesGoal);
  const proteinProgress = calcProgress(protein, proteinGoal);
  const fatsProgress = calcProgress(fats, fatsGoal);

  const size = 280;
  const center = size / 2;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-2xl"
      >
        {/* Outer Ring — Calories (Red/Orange) */}
        <SingleRing
          radius={center - 20}
          strokeWidth={18}
          progress={caloriesProgress}
          gradientId="calories-gradient"
          color1="#FF2D55"
          color2="#FF6B35"
          delay={100}
        />

        {/* Middle Ring — Protein (Green/Lime) */}
        <SingleRing
          radius={center - 48}
          strokeWidth={18}
          progress={proteinProgress}
          gradientId="protein-gradient"
          color1="#30D158"
          color2="#A8E063"
          delay={300}
        />

        {/* Inner Ring — Fats (Blue/Cyan) */}
        <SingleRing
          radius={center - 76}
          strokeWidth={18}
          progress={fatsProgress}
          gradientId="fats-gradient"
          color1="#5AC8FA"
          color2="#007AFF"
          delay={500}
        />

        {/* Center Text */}
        <text
          x="50%"
          y="44%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-bold"
          fontSize="28"
        >
          {Math.round(calories)}
        </text>
        <text
          x="50%"
          y="56%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white/60"
          fontSize="12"
        >
          kcal consumed
        </text>
      </svg>

      {/* Ring Legend */}
      <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-xs">
        <RingLegend
          label="Calories"
          current={Math.round(calories)}
          goal={caloriesGoal}
          color="#FF2D55"
          unit="kcal"
        />
        <RingLegend
          label="Protein"
          current={Math.round(protein)}
          goal={proteinGoal}
          color="#30D158"
          unit="g"
        />
        <RingLegend
          label="Fats"
          current={Math.round(fats)}
          goal={fatsGoal}
          color="#5AC8FA"
          unit="g"
        />
      </div>
    </div>
  );
}

function RingLegend({
  label,
  current,
  goal,
  color,
  unit,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-3 h-3 rounded-full mb-1"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-white/50 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-semibold text-white">
        {current}
        <span className="text-white/40 text-xs">/{goal}{unit}</span>
      </span>
    </div>
  );
}
