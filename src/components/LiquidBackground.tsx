"use client";

// ============================================================
// Fit Me — Liquid Glass Animated Background
// Slow-moving organic gradient blobs that refract through
// glass UI elements. Fixed behind all content.
// ============================================================

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Blob 1 — Emerald (top-left drift) */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.6) 0%, rgba(16,185,129,0.3) 50%, transparent 70%)",
          top: "-10%",
          left: "-5%",
          animation: "blob-float-1 25s ease-in-out infinite",
        }}
      />

      {/* Blob 2 — Teal/Cyan (center-right drift) */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-25 dark:opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.5) 0%, rgba(6,182,212,0.3) 50%, transparent 70%)",
          top: "30%",
          right: "-15%",
          animation: "blob-float-2 30s ease-in-out infinite",
        }}
      />

      {/* Blob 3 — Green/Lime (bottom-left drift) */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full opacity-20 dark:opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,222,128,0.5) 0%, rgba(34,197,94,0.2) 50%, transparent 70%)",
          bottom: "-5%",
          left: "20%",
          animation: "blob-float-3 22s ease-in-out infinite",
        }}
      />

      {/* Subtle noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
