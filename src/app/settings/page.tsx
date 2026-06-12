"use client";

// ============================================================
// Fit Me v2 — Settings Page (White/Green Theme)
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  Dumbbell,
  Target,
  Save,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Profile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(80);
  const [carbs, setCarbs] = useState(250);
  const [fat, setFat] = useState(65);

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
        setName(data.name || "");
        setCalories(data.daily_calories_goal);
        setProtein(data.daily_protein_goal);
        setCarbs(data.daily_carbs_goal);
        setFat(data.daily_fat_goal);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          daily_calories_goal: calories,
          daily_protein_goal: protein,
          daily_carbs_goal: carbs,
          daily_fat_goal: fat,
        })
        .eq("id", user.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Please try again.");
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[var(--fm-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-6">
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
          Settings
        </h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Profile Section */}
        <div className="card-elevated p-5">
          <h2 className="text-xs font-medium text-[var(--fm-text-muted)] uppercase tracking-wider mb-4">
            Profile
          </h2>
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="text-sm text-[var(--fm-text-secondary)]">
              Name
            </label>
            <input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-[var(--fm-text-primary)] focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Goals Section */}
        <div className="card-elevated p-5">
          <h2 className="text-xs font-medium text-[var(--fm-text-muted)] uppercase tracking-wider mb-4">
            Daily Goals
          </h2>
          <div className="space-y-4">
            <GoalInput
              id="settings-calories"
              label="Calories"
              value={calories}
              onChange={setCalories}
              unit="kcal"
              icon={<Flame className="w-4 h-4" />}
              color="var(--fm-green)"
            />
            <GoalInput
              id="settings-protein"
              label="Protein"
              value={protein}
              onChange={setProtein}
              unit="g"
              icon={<Dumbbell className="w-4 h-4" />}
              color="var(--fm-protein)"
            />
            <GoalInput
              id="settings-carbs"
              label="Carbs"
              value={carbs}
              onChange={setCarbs}
              unit="g"
              icon={<Target className="w-4 h-4" />}
              color="var(--fm-carbs)"
            />
            <GoalInput
              id="settings-fat"
              label="Fat"
              value={fat}
              onChange={setFat}
              unit="g"
              icon={<Target className="w-4 h-4" />}
              color="var(--fm-fats)"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 h-11 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
            id="save-settings-btn"
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : saved ? (
              <>
                <Save className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full h-12 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          id="signout-btn"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <p className="text-center text-[10px] text-gray-300 pb-4">
          Fit Me v2.0 · Powered by Gemini AI
        </p>
      </div>

      <Navbar />
    </div>
  );
}

function GoalInput({
  id,
  label,
  value,
  onChange,
  unit,
  icon,
  color,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <label htmlFor={id} className="text-sm text-[var(--fm-text-secondary)] flex-1">
        {label}
      </label>
      <div className="relative w-28">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 pr-9 text-right text-sm font-medium text-[var(--fm-text-primary)] focus:border-[var(--fm-green)] outline-none px-3"
          min={0}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--fm-text-muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}
