"use client";

// ============================================================
// Fit Me v2 — Hamburger Menu (Slide-out Drawer)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="pt-14 pb-6 px-6 bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden border-2 border-white/40">
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
              <Link
                key={index}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[var(--fm-green-bg)] transition-colors group"
              >
                <Icon className="w-5 h-5 text-[var(--fm-text-muted)] group-hover:text-[var(--fm-green)]" />
                <span className="text-sm font-medium text-[var(--fm-text-primary)] group-hover:text-[var(--fm-green)]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
            <span className="text-sm font-medium text-red-400 group-hover:text-red-500">
              Log out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
