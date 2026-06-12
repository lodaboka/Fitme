"use client";

// ============================================================
// Fit Me v3 — Bottom Navigation Bar (Floating Glass Dock)
// Glass blur navbar with glowing center camera button
// ============================================================

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Heart, Camera, BarChart3, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/nutrition", icon: Heart, label: "Nutrition" },
  { href: "/snap", icon: Camera, label: "Snap", isCenter: true },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(24px) saturate(1.8)",
        WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-6"
                id={`nav-${item.label.toLowerCase()}`}
              >
                <motion.div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--fm-green)] shadow-[var(--fm-green)]/30"
                      : "bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] shadow-[var(--fm-green)]/20"
                  }`}
                  style={{
                    boxShadow: `0 4px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className={`text-[9px] mt-1 font-medium ${
                  isActive ? "text-[var(--fm-green)]" : "text-[var(--fm-text-muted)]"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-1 px-3"
              id={`nav-${item.label.toLowerCase()}`}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive
                      ? "text-[var(--fm-green)]"
                      : "text-[var(--fm-text-muted)]"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--fm-green)]"
                    : "text-[var(--fm-text-muted)]"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="w-1 h-1 rounded-full bg-[var(--fm-green)] mt-0.5"
                  layoutId="nav-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
