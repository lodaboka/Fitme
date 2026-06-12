"use client";

// ============================================================
// Fit Me v2 — Macro Warning Component
// Beautiful animated alert when a macro exceeds daily goal
// ============================================================

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface MacroWarningProps {
  exceededMacros: { name: string; current: number; goal: number }[];
}

export default function MacroWarning({ exceededMacros }: MacroWarningProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(exceededMacros.length > 0);
  }, [exceededMacros]);

  if (!visible || exceededMacros.length === 0) return null;

  return (
    <div className="animate-slide-up">
      <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mx-1">
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-amber-600" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 pr-6">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">
              Daily Limit Exceeded
            </h4>
            <div className="space-y-1">
              {exceededMacros.map((macro) => (
                <p key={macro.name} className="text-xs text-amber-700">
                  <span className="font-medium">{macro.name}:</span>{" "}
                  {Math.round(macro.current)}
                  <span className="text-amber-500">/{macro.goal}</span>
                  {" "}(+{Math.round(macro.current - macro.goal)} over)
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
