"use client";

// ============================================================
// Fit Me v2 — Scroll Picker Component
// Vertical scroll wheel for number selection (e.g., age)
// Touch-friendly, matching the mockup's scroll-wheel UI
// ============================================================

import { useRef, useEffect, useCallback, useState } from "react";

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  itemHeight?: number;
}

export default function ScrollPicker({
  min,
  max,
  value,
  onChange,
  suffix = "",
  itemHeight = 52,
}: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const visibleItems = 5;
  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  const scrollToValue = useCallback(
    (val: number, smooth = true) => {
      const container = containerRef.current;
      if (!container) return;
      const index = val - min;
      const scrollTop = index * itemHeight;
      container.scrollTo({
        top: scrollTop,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    [min, itemHeight]
  );

  useEffect(() => {
    scrollToValue(value, false);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const newValue = min + clampedIndex;

    if (newValue !== value) {
      onChange(newValue);
    }
  }, [min, items.length, itemHeight, value, onChange]);

  const handleScrollEnd = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    container.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: "smooth",
    });
    setIsDragging(false);
  }, [itemHeight, items.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimer: NodeJS.Timeout;
    const onScroll = () => {
      setIsDragging(true);
      handleScroll();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScrollEnd, 100);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
    };
  }, [handleScroll, handleScrollEnd]);

  return (
    <div className="relative" style={{ height: containerHeight }}>
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none border-y-2 border-[var(--fm-green)]/30 bg-[var(--fm-green-bg)]/50 rounded-xl"
        style={{
          top: paddingItems * itemHeight,
          height: itemHeight,
        }}
      />

      {/* Fade overlays */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />

        {/* Items */}
        {items.map((item) => {
          const isSelected = item === value;
          return (
            <div
              key={item}
              className={`flex items-center justify-center snap-center transition-all duration-200 ${
                isSelected
                  ? "text-[var(--fm-green)] scale-110"
                  : "text-[var(--fm-text-muted)] scale-90 opacity-40"
              }`}
              style={{ height: itemHeight }}
              onClick={() => {
                onChange(item);
                scrollToValue(item);
              }}
            >
              <span
                className={`text-3xl font-bold ${
                  isSelected ? "text-[var(--fm-text-primary)]" : ""
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item}
              </span>
              {suffix && isSelected && (
                <span className="text-sm text-[var(--fm-text-muted)] ml-2 mt-2">
                  {suffix}
                </span>
              )}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: paddingItems * itemHeight }} />
      </div>
    </div>
  );
}
