"use client";

// ============================================================
// Fit Me v2 — Bottom Navigation Bar (White/Green Theme)
// 5 icons: Home, Favorites, Camera, Analytics, Profile
// ============================================================

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Heart, Camera, BarChart3, User } from "lucide-react";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
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
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--fm-green)] shadow-[var(--fm-green)]/30"
                    : "bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] shadow-[var(--fm-green)]/20"
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
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
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--fm-green)]"
                    : "text-[var(--fm-text-muted)]"
                }`}
              />
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
                <div className="w-1 h-1 rounded-full bg-[var(--fm-green)] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
