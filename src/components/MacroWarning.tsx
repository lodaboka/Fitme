"use client";

// ============================================================
// Fit Me v3 — Macro Warning (Liquid Glass Theme)
// Spring-drop glass alert with AnimatePresence
// ============================================================

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MacroWarningProps {
  exceededMacros: { name: string; current: number; goal: number }[];
}

export default function MacroWarning({ exceededMacros }: MacroWarningProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(exceededMacros.length > 0);
  }, [exceededMacros]);

  return (
    <AnimatePresence>
      {visible && exceededMacros.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8,
          }}
        >
          <div
            className="relative glass-panel p-4 mx-1"
            style={{
              background: "rgba(251, 191, 36, 0.08)",
              border: "1px solid rgba(251, 191, 36, 0.2)",
            }}
          >
            {/* Close button */}
            <motion.button
              onClick={() => setVisible(false)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full glass-card flex items-center justify-center transition-colors"
              whileTap={{ scale: 0.85 }}
            >
              <X className="w-3.5 h-3.5 text-amber-500" />
            </motion.button>

            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(251, 191, 36, 0.15)" }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 pr-6">
                <h4 className="text-sm font-semibold text-amber-700 mb-1">
                  Daily Limit Exceeded
                </h4>
                <div className="space-y-1">
                  {exceededMacros.map((macro) => (
                    <p key={macro.name} className="text-xs text-amber-600">
                      <span className="font-medium">{macro.name}:</span>{" "}
                      {Math.round(macro.current)}
                      <span className="text-amber-400">/{macro.goal}</span>
                      {" "}(+{Math.round(macro.current - macro.goal)} over)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
