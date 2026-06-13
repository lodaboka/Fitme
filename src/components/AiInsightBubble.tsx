"use client";

// ============================================================
// Fit Me v4 — AI Insight Bubble (Dashboard Typewriter Chat)
// Minimal glass chat bubble with Framer Motion typewriter
// animation. Fetches from 3-tier AI failover pipeline.
// Cached daily in localStorage.
// ============================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AiInsightBubble() {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      // Check localStorage cache — only fetch once per day
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = "fitme_dashboard_insight";
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.text) {
            setInsight(parsed.text);
            setDisplayedText(parsed.text); // Show full text (already seen)
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache, refetch
        }
      }

      // Fetch fresh insight from 3-tier AI pipeline
      try {
        const res = await fetch("/api/analytics/insight");
        if (res.ok) {
          const data = await res.json();
          const text =
            data.insight || "Keep tracking your meals for AI insights! 💪";
          setInsight(text);
          // Cache with today's date
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ date: today, text })
          );
          // Trigger typewriter for fresh insights
          setIsTyping(true);
        } else {
          setInsight("Keep tracking your meals for AI insights! 💪");
          setDisplayedText("Keep tracking your meals for AI insights! 💪");
        }
      } catch {
        setInsight("Keep tracking your meals for AI insights! 💪");
        setDisplayedText("Keep tracking your meals for AI insights! 💪");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  // Typewriter effect for fresh insights
  useEffect(() => {
    if (!isTyping || !insight) return;

    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      i++;
      setDisplayedText(insight.slice(0, i));
      if (i >= insight.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isTyping, insight]);

  return (
    <motion.div
      className="glass-panel p-4 relative overflow-hidden"
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--fm-green), var(--fm-green-light), var(--fm-carbs))",
        }}
      />

      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(52,211,153,0.1) 100%)",
          }}
        >
          <Sparkles className="w-4 h-4 text-[var(--fm-green)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[10px] font-bold text-[var(--fm-green)] uppercase tracking-wider">
              AI Coach
            </p>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-[var(--fm-green)]" />
              <div className="w-1 h-1 rounded-full bg-[var(--fm-green)]/60" />
              <div className="w-1 h-1 rounded-full bg-[var(--fm-green)]/30" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-1.5">
              <div className="h-3 glass-skeleton w-full rounded-full" />
              <div className="h-3 glass-skeleton w-2/3 rounded-full" />
            </div>
          ) : (
            <p className="text-sm text-[var(--fm-text-secondary)] leading-relaxed">
              {displayedText}
              {isTyping && (
                <motion.span
                  className="inline-block w-[2px] h-[14px] bg-[var(--fm-green)] ml-0.5 align-middle rounded-full"
                  animate={{ opacity: [1, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              )}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
