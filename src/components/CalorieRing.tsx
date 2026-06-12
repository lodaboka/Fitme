"use client";

// ============================================================
// Fit Me v2.1 — Calorie Ring Component (Premium Animated)
// Animated SVG ring with CSS stroke-dashoffset transition
// Vibrant gradient, animated counter, pulsing glow
// ============================================================

import { useEffect, useState, useRef } from "react";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({
  consumed,
  goal,
  size = 220,
}: CalorieRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayedCalories, setDisplayedCalories] = useState(0);
  const animFrameRef = useRef<number>(0);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
  const remaining = Math.max(goal - consumed, 0);

  // Animate ring fill
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Animate counter ticking up
  useEffect(() => {
    const duration = 800;
    const start = 0;
    const end = consumed;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedCalories(Math.round(start + (end - start) * eased));
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [consumed]);

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="ring-glow"
      >
        {/* Gradient */}
        <defs>
          <linearGradient id="calorie-gradient-v2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="40%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#8BC34A" />
          </linearGradient>
          {/* Glow filter for the ring endpoint */}
          <filter id="ring-endpoint-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8F5E9"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring with CSS transition */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calorie-gradient-v2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={animatedProgress > 5 ? "url(#ring-endpoint-glow)" : undefined}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[42px] font-bold text-[var(--fm-text-primary)] leading-none"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {displayedCalories}
        </span>
        <span className="text-[11px] text-[var(--fm-text-muted)] mt-1 tracking-wide uppercase">
          Kcal consumed
        </span>
        <div className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--fm-green-bg)] to-[#E8F5E9]">
          <span
            className="text-[10px] font-semibold text-[var(--fm-green-dark)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {remaining > 0 ? `${Math.round(remaining)} left` : "🎉 Goal reached!"}
          </span>
        </div>
      </div>
    </div>
  );
}
