"use client";

// ============================================================
// Fit Me v4 — Profile Page (Liquid Glass Theme)
// "Reset Goals" replaces editable fields — routes to /onboarding
// Glass panels, Framer Motion animations, confirmation modal
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  ChevronRight,
  Camera,
  Settings,
  Loader2,
  RotateCcw,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Profile } from "@/lib/types";

const MENU_ITEMS = [
  { href: "/snap", icon: Flame, label: "Daily Intake", desc: "Track your meals" },
  { href: "/nutrition", icon: UtensilsCrossed, label: "My Meals", desc: "View logged meals" },
  { href: "/analytics", icon: BarChart3, label: "Nutrition Report", desc: "Charts & analytics" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
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

  const handleResetGoals = async () => {
    if (!profile) return;
    setResetting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: false })
        .eq("id", profile.id);

      if (error) throw error;

      setShowResetModal(false);
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      console.error("Reset goals error:", err);
      alert("Failed to reset goals. Please try again.");
    } finally {
      setResetting(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm px-5 space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full glass-skeleton" />
            <div className="h-5 w-32 glass-skeleton mt-4 rounded-full" />
            <div className="h-3 w-24 glass-skeleton mt-2 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 glass-skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      className="min-h-screen pb-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Reset Goals Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !resetting && setShowResetModal(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div
                className="w-full max-w-sm mx-auto rounded-3xl p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.14)",
                  backdropFilter: "blur(32px) saturate(2)",
                  WebkitBackdropFilter: "blur(32px) saturate(2)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 8px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Warning icon */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(245, 158, 11, 0.12)" }}
                  >
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3
                    className="text-lg font-bold text-[var(--fm-text-primary)] mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Reset Your Goals?
                  </h3>
                  <p className="text-sm text-[var(--fm-text-muted)] leading-relaxed mb-6">
                    This will clear your current nutrition targets and take you
                    through the setup wizard again from scratch.
                  </p>

                  <div className="flex gap-3 w-full">
                    <motion.button
                      onClick={() => setShowResetModal(false)}
                      disabled={resetting}
                      className="flex-1 h-12 rounded-full glass-card flex items-center justify-center gap-2 text-sm font-medium text-[var(--fm-text-primary)] hover:bg-white/10 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleResetGoals}
                      disabled={resetting}
                      className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)",
                      }}
                      whileTap={!resetting ? { scale: 0.95 } : {}}
                    >
                      {resetting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex items-center gap-3 px-5 pt-14 pb-4"
        variants={itemVariants}
      >
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--fm-text-primary)]" />
        </Link>
        <h1
          className="text-xl font-bold text-[var(--fm-text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          My Profile
        </h1>
      </motion.div>

      <div className="px-5 space-y-5">
        {/* Profile Card */}
        <motion.div className="glass-panel p-6 flex flex-col items-center" variants={itemVariants}>
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-lg">
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
            <motion.button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--fm-green)] flex items-center justify-center shadow-md border-2 border-white/10 hover:bg-[var(--fm-green-dark)] transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.85 }}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </motion.button>
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
        </motion.div>

        {/* Current Stats Summary (read-only) */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-[var(--fm-green)]" />
            Current Goals
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl glass-card">
              <p className="text-lg font-bold text-[var(--fm-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.current_weight_kg || "—"}
              </p>
              <p className="text-[9px] text-[var(--fm-text-muted)] mt-0.5 uppercase tracking-wider">kg now</p>
            </div>
            <div className="text-center p-3 rounded-xl glass-card">
              <p className="text-lg font-bold text-[var(--fm-green)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.target_weight_kg || "—"}
              </p>
              <p className="text-[9px] text-[var(--fm-text-muted)] mt-0.5 uppercase tracking-wider">kg target</p>
            </div>
            <div className="text-center p-3 rounded-xl glass-card">
              <p className="text-lg font-bold text-[var(--fm-fats)]" style={{ fontFamily: "var(--font-heading)" }}>
                {profile.daily_calories_goal || "—"}
              </p>
              <p className="text-[9px] text-[var(--fm-text-muted)] mt-0.5 uppercase tracking-wider">kcal/day</p>
            </div>
          </div>

          {/* Reset Goals Button */}
          <motion.button
            onClick={() => setShowResetModal(true)}
            className="mt-5 w-full h-12 rounded-full glass-card flex items-center justify-center gap-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/5 transition-colors"
            whileTap={{ scale: 0.95 }}
            id="reset-goals-btn"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Goals
          </motion.button>
        </motion.div>

        {/* Menu Items */}
        <motion.div className="glass-panel overflow-hidden" variants={itemVariants}>
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors ${
                  index < MENU_ITEMS.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--fm-green)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--fm-text-primary)]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--fm-text-muted)]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--fm-text-muted)]" />
              </Link>
            );
          })}
        </motion.div>

        {/* Settings & Logout */}
        <motion.div className="space-y-3" variants={itemVariants}>
          <Link
            href="/settings"
            className="glass-panel flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors w-full"
          >
            <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
              <Settings className="w-5 h-5 text-[var(--fm-text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--fm-text-primary)] flex-1">
              Settings
            </p>
            <ChevronRight className="w-4 h-4 text-[var(--fm-text-muted)]" />
          </Link>

          <motion.button
            onClick={handleSignOut}
            className="glass-panel flex items-center gap-4 px-5 py-4 hover:bg-red-500/5 transition-colors w-full text-left"
            whileTap={{ scale: 0.98 }}
            id="signout-btn"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-400">Log out</p>
          </motion.button>
        </motion.div>

        <p className="text-center text-[10px] text-[var(--fm-text-muted)] pb-4">
          Fit Me v4 · Powered by AI
        </p>
      </div>

      <Navbar />
    </motion.div>
  );
}
