// ============================================================
// Fit Me — Profile Loading Screen (Liquid Glass)
// ============================================================

export default function ProfileLoading() {
  return (
    <div className="min-h-screen pb-24">
      {/* Header skeleton */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl glass-skeleton" />
        <div>
          <div className="h-5 w-28 glass-skeleton mb-1 rounded-lg" />
          <div className="h-3 w-20 glass-skeleton rounded-md" />
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full glass-skeleton mb-3" />
          <div className="h-5 w-32 glass-skeleton rounded-lg mb-1" />
          <div className="h-3 w-24 glass-skeleton rounded-md" />
        </div>

        {/* Stats row skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-4 flex-1 space-y-2">
              <div className="h-6 w-12 glass-skeleton rounded-md mx-auto" />
              <div className="h-3 w-16 glass-skeleton rounded-md mx-auto" />
            </div>
          ))}
        </div>

        {/* Menu items skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-skeleton" />
            <div className="flex-1">
              <div className="h-4 w-28 glass-skeleton rounded-md mb-1" />
              <div className="h-3 w-40 glass-skeleton rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
