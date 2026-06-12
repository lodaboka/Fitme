"use client";

// ============================================================
// Fit Me v3 — Hamburger Menu (Glass Slide-out Drawer)
// Framer Motion slide-in with glass blur backdrop
// ============================================================

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Home,
  Flame,
  UtensilsCrossed,
  BarChart3,
  Heart,
  LogOut,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl: string | null;
}

const MENU_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/snap", icon: Flame, label: "Daily Intake" },
  { href: "/nutrition", icon: UtensilsCrossed, label: "My Meals" },
  { href: "/analytics", icon: BarChart3, label: "Nutrition Report" },
  { href: "/profile", icon: Heart, label: "Favourites Food" },
  { href: "/profile", icon: Settings, label: "Settings" },
];

export default function HamburgerMenu({
  isOpen,
  onClose,
  userName,
  avatarUrl,
}: HamburgerMenuProps) {
  const router = useRouter();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
    router.refresh();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Glass Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Glass Drawer */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col"
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(32px) saturate(2)",
              WebkitBackdropFilter: "blur(32px) saturate(2)",
              borderRight: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "8px 0 40px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="pt-14 pb-6 px-6 bg-gradient-to-br from-[var(--fm-green)]/80 to-[var(--fm-green-light)]/60">
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass-card flex items-center justify-center"
                whileTap={{ scale: 0.85 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>

              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <h3 className="text-white font-bold text-lg">{userName}</h3>
              <p className="text-white/70 text-xs">Tracking your nutrition</p>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-4 px-3">
              {MENU_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <Icon className="w-5 h-5 text-[var(--fm-text-muted)] group-hover:text-[var(--fm-green)]" />
                      <span className="text-sm font-medium text-[var(--fm-text-primary)] group-hover:text-[var(--fm-green)]">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Sign Out */}
            <div className="p-4 border-t border-white/10">
              <motion.button
                onClick={handleSignOut}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors w-full text-left group"
                whileTap={{ scale: 0.97 }}
              >
                <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                <span className="text-sm font-medium text-red-400 group-hover:text-red-500">
                  Log out
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
