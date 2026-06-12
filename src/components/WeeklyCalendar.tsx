"use client";

// ============================================================
// Fit Me v3 — Weekly Calendar (Liquid Glass Theme)
// Glass pill day selector with Framer Motion taps
// ============================================================

import { useMemo } from "react";
import { motion } from "framer-motion";

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function WeeklyCalendar({
  selectedDate,
  onDateSelect,
}: WeeklyCalendarProps) {
  const days = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();
    // Show 7 days: 3 before today, today, 3 after
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <div className="w-full">
      {/* Month label */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-[var(--fm-text-primary)]">
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </span>
      </div>

      {/* Day pills — glass-styled */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate);
          const dayIsToday = isToday(day);

          return (
            <motion.button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`flex flex-col items-center min-w-[52px] py-2.5 px-2 rounded-2xl transition-colors duration-200 ${
                isSelected
                  ? "bg-[var(--fm-green)] text-white shadow-lg shadow-[var(--fm-green)]/25"
                  : dayIsToday
                  ? "glass-card text-[var(--fm-green-dark)]"
                  : "glass-card text-[var(--fm-text-secondary)]"
              }`}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <span className={`text-[10px] font-medium ${
                isSelected ? "text-white/80" : ""
              }`}>
                {dayNames[day.getDay()]}
              </span>
              <span className={`text-lg font-bold mt-0.5 ${
                isSelected ? "text-white" : "text-[var(--fm-text-primary)]"
              }`}>
                {day.getDate()}
              </span>
              {dayIsToday && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-[var(--fm-green)] mt-0.5" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
