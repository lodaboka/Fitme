"use client";

// ============================================================
// Fit Me v2.1 — Profile Page
// Fixed: Avatar upload now works with Supabase Storage
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  UtensilsCrossed,
  BarChart3,
  Heart,
  LogOut,
  ChevronRight,
  Camera,
  Settings,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Profile } from "@/lib/types";

const MENU_ITEMS = [
  { href: "/snap", icon: Flame, label: "Daily Intake", desc: "Track your meals" },
  { href: "/nutrition", icon: UtensilsCrossed, label: "My Meals", desc: "View logged meals" },
  { href: "/analytics", icon: BarChart3, label: "Nutrition Report", desc: "Charts & analytics" },
  { href: "/profile", icon: Heart, label: "Favourites Food", desc: "Coming soon" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Compress the avatar image
      let processedFile = file;
      if (typeof window !== "undefined") {
        try {
          const imageCompression = (await import("browser-image-compression")).default;
          processedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
            useWebWorker: true,
          });
        } catch {
          console.warn("Avatar compression failed, using original");
        }
      }

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, processedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      // Add cache-bust query to force refresh
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        {/* Skeleton loading */}
        <div className="w-full max-w-sm px-5 space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full skeleton-pulse" />
            <div className="h-5 w-32 skeleton-pulse mt-4" />
            <div className="h-3 w-24 skeleton-pulse mt-2" />
          </div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 skeleton-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen pb-24 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--fm-text-primary)]" />
        </Link>
        <h1
          className="text-xl font-bold text-[var(--fm-text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          My Profile
        </h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Profile Card */}
        <div className="card-elevated p-6 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {(profile.name || "U").charAt(0).toUpperCase()}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--fm-green)] flex items-center justify-center shadow-md border-2 border-white hover:bg-[var(--fm-green-dark)] transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            {/* Hidden file input for avatar */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-input"
            />
          </div>

          <h2
            className="text-xl font-bold text-[var(--fm-text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {profile.name || "User"}
          </h2>
          <p className="text-sm text-[var(--fm-text-muted)] mt-0.5">
            {profile.goal === "lose"
              ? "🔥 Losing weight"
              : profile.goal === "gain"
              ? "💪 Gaining weight"
              : "⚖️ Maintaining"}
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100 w-full justify-center">
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.current_weight_kg || "—"}
              </p>
              <p className="text-[10px] text-[var(--fm-text-muted)]">Current kg</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--fm-green)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.target_weight_kg || "—"}
              </p>
              <p className="text-[10px] text-[var(--fm-text-muted)]">Target kg</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.daily_calories_goal}
              </p>
              <p className="text-[10px] text-[var(--fm-text-muted)]">Daily kcal</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card-elevated overflow-hidden">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  index < MENU_ITEMS.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--fm-green-bg)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--fm-green)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--fm-text-primary)]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--fm-text-muted)]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            );
          })}
        </div>

        {/* Settings & Logout */}
        <div className="space-y-3">
          <Link
            href="/settings"
            className="card-elevated flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[var(--fm-text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--fm-text-primary)] flex-1">
              Settings
            </p>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>

          <button
            onClick={handleSignOut}
            className="card-elevated flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors w-full text-left"
            id="signout-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-400">Log out</p>
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-300 pb-4">
          Fit Me v2.1 · Powered by Gemini AI
        </p>
      </div>

      <Navbar />
    </div>
  );
}
