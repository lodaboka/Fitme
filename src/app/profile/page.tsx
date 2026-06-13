"use client";

// ============================================================
// Fit Me v3 — Profile Page (Liquid Glass Theme)
// Editable weight & calorie goals with stepper inputs
// Glass panels, Framer Motion animations
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
  Minus,
  Plus,
  Check,
  Weight,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Profile } from "@/lib/types";
import { calculateMacroSplit } from "@/lib/calculations";

const MENU_ITEMS = [
  { href: "/snap", icon: Flame, label: "Daily Intake", desc: "Track your meals" },
  { href: "/nutrition", icon: UtensilsCrossed, label: "My Meals", desc: "View logged meals" },
  { href: "/analytics", icon: BarChart3, label: "Nutrition Report", desc: "Charts & analytics" },
  { href: "/profile", icon: Heart, label: "Favourites Food", desc: "Coming soon" },
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [editCurrentWeight, setEditCurrentWeight] = useState<number>(0);
  const [editTargetWeight, setEditTargetWeight] = useState<number>(0);
  const [editCalorieGoal, setEditCalorieGoal] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false);

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

      if (data) {
        setProfile(data);
        setEditCurrentWeight(data.current_weight_kg || 0);
        setEditTargetWeight(data.target_weight_kg || 0);
        setEditCalorieGoal(data.daily_calories_goal || 0);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const changed =
      editCurrentWeight !== (profile.current_weight_kg || 0) ||
      editTargetWeight !== (profile.target_weight_kg || 0) ||
      editCalorieGoal !== (profile.daily_calories_goal || 0);
    setHasChanges(changed);
    setSaved(false);
  }, [editCurrentWeight, editTargetWeight, editCalorieGoal, profile]);

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

  const handleSaveChanges = async () => {
    if (!profile || !hasChanges) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Recalculate macros based on new calorie target
      const macros = calculateMacroSplit(editCalorieGoal, profile.goal || "maintain");

      const { error } = await supabase
        .from("profiles")
        .update({
          current_weight_kg: editCurrentWeight,
          target_weight_kg: editTargetWeight,
          daily_calories_goal: editCalorieGoal,
          daily_protein_goal: macros.protein,
          daily_carbs_goal: macros.carbs,
          daily_fat_goal: macros.fat,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              current_weight_kg: editCurrentWeight,
              target_weight_kg: editTargetWeight,
              daily_calories_goal: editCalorieGoal,
              daily_protein_goal: macros.protein,
              daily_carbs_goal: macros.carbs,
              daily_fat_goal: macros.fat,
            }
          : prev
      );

      setSaved(true);
      setHasChanges(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
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

        {/* Edit Goals Section */}
        <motion.div className="glass-panel p-5" variants={itemVariants}>
          <h3 className="text-sm font-bold text-[var(--fm-text-primary)] mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-[var(--fm-green)]" />
            Edit Goals
          </h3>

          <div className="space-y-4">
            {/* Current Weight */}
            <StepperField
              label="Current Weight"
              value={editCurrentWeight}
              onChange={setEditCurrentWeight}
              step={0.5}
              min={20}
              max={300}
              unit="kg"
              icon={<Weight className="w-4 h-4 text-[var(--fm-text-muted)]" />}
            />

            {/* Target Weight */}
            <StepperField
              label="Target Weight"
              value={editTargetWeight}
              onChange={setEditTargetWeight}
              step={0.5}
              min={20}
              max={300}
              unit="kg"
              icon={<Target className="w-4 h-4 text-[var(--fm-green)]" />}
            />

            {/* Daily Calorie Target */}
            <StepperField
              label="Daily Calories"
              value={editCalorieGoal}
              onChange={setEditCalorieGoal}
              step={50}
              min={800}
              max={6000}
              unit="kcal"
              icon={<Flame className="w-4 h-4 text-[var(--fm-fats)]" />}
            />
          </div>

          {/* Save Button */}
          <AnimatePresence>
            {(hasChanges || saved) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-5"
              >
                <motion.button
                  onClick={handleSaveChanges}
                  disabled={saving || saved || !hasChanges}
                  className="w-full h-12 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: saved
                      ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      : "linear-gradient(135deg, var(--fm-green) 0%, var(--fm-green-light) 100%)",
                    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                  }}
                  whileTap={!saving && !saved ? { scale: 0.95 } : {}}
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
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
          Fit Me v3 · Powered by Gemini AI
        </p>
      </div>

      <Navbar />
    </motion.div>
  );
}

// ── Stepper Field Component ──────────────────────────────────
function StepperField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  unit,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
}) {
  const decrement = () => onChange(Math.max(min, +(value - step).toFixed(1)));
  const increment = () => onChange(Math.min(max, +(value + step).toFixed(1)));

  return (
    <div className="flex items-center justify-between glass-card p-3 rounded-xl">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <p className="text-xs font-semibold text-[var(--fm-text-primary)]">{label}</p>
          <p className="text-[10px] text-[var(--fm-text-muted)]">{unit}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={decrement}
          className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-[var(--fm-text-primary)] hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.85 }}
        >
          <Minus className="w-3.5 h-3.5" />
        </motion.button>
        <span
          className="text-sm font-bold text-[var(--fm-text-primary)] w-16 text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </span>
        <motion.button
          onClick={increment}
          className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-[var(--fm-text-primary)] hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.85 }}
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
