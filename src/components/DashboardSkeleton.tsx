"use client";

// ============================================================
// Fit Me v3 — Dashboard Skeleton (Liquid Glass Loading)
// Pulsing glass orb + glass shimmer panels
// ============================================================

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      {/* Header skeleton */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl glass-skeleton" />
          <div>
            <div className="h-3 w-20 glass-skeleton mb-2 rounded-lg" />
            <div className="h-5 w-28 glass-skeleton rounded-lg" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl glass-skeleton" />
      </div>

      <div className="px-5 space-y-6">
        {/* Calorie ring skeleton — glass orb pulse */}
        <div className="glass-panel py-10 flex flex-col items-center">
          <div className="relative w-[200px] h-[200px]">
            {/* Pulsing glass orb */}
            <div
              className="absolute inset-0 rounded-full animate-glass-orb"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.1), rgba(45,212,191,0.08))",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
            {/* Inner circle */}
            <div className="absolute inset-8 rounded-full glass-card flex flex-col items-center justify-center">
              <div className="h-6 w-16 glass-skeleton rounded-lg mb-2" />
              <div className="h-3 w-12 glass-skeleton rounded-md" />
            </div>
          </div>
        </div>

        {/* Macro cards skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel p-4 flex-1 min-w-[100px] space-y-3"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl glass-skeleton" />
                <div className="h-3 w-12 glass-skeleton rounded-md" />
              </div>
              <div className="h-5 w-16 glass-skeleton rounded-md" />
              <div className="h-[5px] w-full glass-skeleton rounded-full" />
            </div>
          ))}
        </div>

        {/* Calendar skeleton */}
        <div>
          <div className="h-4 w-40 glass-skeleton mb-3 rounded-md" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="flex-1 h-16 glass-skeleton rounded-2xl"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Meals skeleton */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 w-28 glass-skeleton rounded-md" />
            <div className="h-8 w-24 glass-skeleton rounded-full" />
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel p-4 mb-3 flex gap-3"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl glass-skeleton shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 glass-skeleton rounded-md" />
                <div className="h-3 w-36 glass-skeleton rounded-md" />
              </div>
              <div className="w-14 h-6 glass-skeleton rounded-full self-center" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
