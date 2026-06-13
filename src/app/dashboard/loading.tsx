// ============================================================
// Fit Me — Dashboard Loading Screen (Liquid Glass)
// Shown while server fetches profile & food logs
// ============================================================

export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background:
          "linear-gradient(135deg, #0c1a0e 0%, #0f1f14 30%, #0a1a12 60%, #091510 100%)",
      }}
    >
      {/* Spinner container */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer spinning ring */}
        <div
          className="w-20 h-20 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(16,185,129,0.5) 80%, rgba(52,211,153,0.9) 100%)",
            animationDuration: "1.2s",
          }}
        />
        {/* Inner glass circle with Leaf icon */}
        <div
          className="absolute w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(52,211,153,0.08) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(16,185,129,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 1 8-1 3.5-3 5-5.3 6.4" />
            <path d="M10.7 20.7a7 7 0 0 0 3.5-12.2" />
            <path d="M12 22v-5" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <h2
        className="text-lg font-semibold tracking-tight mb-1.5"
        style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-heading)" }}
      >
        Loading your dashboard…
      </h2>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        Fetching your nutrition data
      </p>
    </div>
  );
}
