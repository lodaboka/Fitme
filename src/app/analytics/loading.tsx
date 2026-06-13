// ============================================================
// Fit Me — Analytics Loading Screen (Liquid Glass)
// ============================================================

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen pb-24">
      {/* Header skeleton */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl glass-skeleton" />
        <div>
          <div className="h-5 w-24 glass-skeleton mb-1 rounded-lg" />
          <div className="h-3 w-36 glass-skeleton rounded-md" />
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Toggle pills skeleton */}
        <div className="flex gap-2">
          <div className="h-9 w-20 glass-skeleton rounded-full" />
          <div className="h-9 w-20 glass-skeleton rounded-full" />
        </div>

        {/* Chart area skeleton */}
        <div className="glass-panel p-5 space-y-4">
          <div className="h-4 w-32 glass-skeleton rounded-md" />
          <div className="h-48 w-full glass-skeleton rounded-xl" />
        </div>

        {/* Food items skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-skeleton" />
            <div className="flex-1">
              <div className="h-4 w-24 glass-skeleton rounded-md mb-1" />
              <div className="h-3 w-32 glass-skeleton rounded-md" />
            </div>
            <div className="h-5 w-14 glass-skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
