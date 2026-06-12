"use client";

// ============================================================
// Fit Me v2.1 — Onboarding Page (9 Steps — Goal Auto-Inferred)
// Goal is automatically determined from target vs current weight
// ============================================================

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Dumbbell,
  Target,
  Scale,
  Ruler,
  Activity,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateBMR, calculateTDEE, calculateMacroSplit, feetInchesToCm } from "@/lib/calculations";
import ScrollPicker from "@/components/ScrollPicker";
import WeightRuler from "@/components/WeightRuler";
import HeightPicker from "@/components/HeightPicker";
import CalorieSlider from "@/components/CalorieSlider";
import type { Gender, Goal, ActivityLevel, HeightUnit, WeightUnit } from "@/lib/types";

const STEPS = [
  { title: "Welcome to Fit Me", subtitle: "Track your nutrition, transform your health", icon: Sparkles },
  { title: "What's your name?", subtitle: "Let's personalize your experience", icon: Users },
  { title: "How old are you?", subtitle: "This helps calculate your metabolism", icon: Target },
  { title: "Select your gender", subtitle: "For accurate calorie estimation", icon: Users },
  { title: "What's your height?", subtitle: "Used for BMR calculation", icon: Ruler },
  { title: "Current weight", subtitle: "Your starting point", icon: Scale },
  { title: "Target weight", subtitle: "Where you want to be", icon: Target },
  { title: "Activity level", subtitle: "How active are you on average?", icon: Activity },
  { title: "Your daily target", subtitle: "Drag the slider to adjust", icon: Dumbbell },
];

const ACTIVITY_OPTIONS: { label: string; value: ActivityLevel; desc: string }[] = [
  { label: "Sedentary", value: "Sedentary", desc: "Desk job, little exercise" },
  { label: "Light", value: "Light", desc: "Light exercise 1-3 days/week" },
  { label: "Moderate", value: "Moderate", desc: "Exercise 3-5 days/week" },
  { label: "Active", value: "Active", desc: "Hard exercise 6-7 days/week" },
  { label: "Very Active", value: "Very Active", desc: "Athlete / physical job" },
];

const GENDER_OPTIONS: { label: string; value: Gender; emoji: string }[] = [
  { label: "Female", value: "Female", emoji: "👩" },
  { label: "Male", value: "Male", emoji: "👨" },
  { label: "Other", value: "Other", emoji: "🧑" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightCm, setHeightCm] = useState(170);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [currentWeightKg, setCurrentWeightKg] = useState(70);
  const [targetWeightKg, setTargetWeightKg] = useState(65);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [dailyCalories, setDailyCalories] = useState(2000);

  // Compute height in cm (for calculations)
  const heightInCm = heightUnit === "cm" ? heightCm : feetInchesToCm(heightFt, heightIn);

  // Auto-infer goal from target vs current weight
  const inferredGoal: Goal = useMemo(() => {
    if (targetWeightKg < currentWeightKg - 0.5) return "lose";
    if (targetWeightKg > currentWeightKg + 0.5) return "gain";
    return "maintain";
  }, [currentWeightKg, targetWeightKg]);

  // Calculate BMR & TDEE
  const bmr = useMemo(() => {
    if (!gender || heightInCm <= 0 || currentWeightKg <= 0 || age <= 0) return 0;
    return calculateBMR(currentWeightKg, heightInCm, age, gender);
  }, [currentWeightKg, heightInCm, age, gender]);

  const tdee = useMemo(() => {
    if (bmr <= 0 || !activityLevel) return 0;
    return calculateTDEE(bmr, activityLevel);
  }, [bmr, activityLevel]);

  // Auto-set daily calories based on inferred goal when we reach step 8
  const autoSetCalories = () => {
    if (tdee <= 0) return;
    switch (inferredGoal) {
      case "lose":
        setDailyCalories(Math.round(tdee - 500));
        break;
      case "gain":
        setDailyCalories(Math.round(tdee + 300));
        break;
      case "maintain":
        setDailyCalories(tdee);
        break;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return name.trim().length > 0;
      case 2: return age > 0;
      case 3: return gender !== null;
      case 4: return heightInCm > 0;
      case 5: return currentWeightKg > 0;
      case 6: return targetWeightKg > 0;
      case 7: return activityLevel !== null;
      case 8: return dailyCalories > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      // If going to calorie slider step (step 8), auto-calculate
      if (step === 7) autoSetCalories();
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const macros = calculateMacroSplit(dailyCalories, inferredGoal);

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name || "User",
          age,
          gender,
          height_cm: heightInCm,
          height_ft: heightFt,
          height_in: heightIn,
          height_unit: heightUnit,
          current_weight_kg: currentWeightKg,
          target_weight_kg: targetWeightKg,
          weight_unit: weightUnit,
          goal: inferredGoal,
          activity_level: activityLevel,
          bmr,
          tdee,
          daily_calories_goal: dailyCalories,
          daily_protein_goal: macros.protein,
          daily_carbs_goal: macros.carbs,
          daily_fat_goal: macros.fat,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Onboarding error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Progress bar */}
      {step > 0 && (
        <div className="px-5 pt-14 pb-2">
          <div className="flex gap-1.5">
            {STEPS.slice(1).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                  i < step
                    ? "bg-[var(--fm-green)]"
                    : i === step - 1
                    ? "bg-[var(--fm-green)]/50"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--fm-green)]/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1
              className="text-3xl font-bold text-[var(--fm-text-primary)] mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Fit Me
            </h1>
            <p className="text-[var(--fm-text-secondary)] text-sm max-w-xs mx-auto mb-2">
              Track Your Nutrition,<br />Transform Your Health
            </p>
            <p className="text-[var(--fm-text-muted)] text-xs max-w-xs mx-auto">
              AI-powered food recognition optimized for Indian cuisine
            </p>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-8">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full text-center text-2xl font-bold text-[var(--fm-text-primary)] bg-transparent border-b-2 border-gray-200 focus:border-[var(--fm-green)] outline-none pb-3 transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-6">
              <ScrollPicker
                min={10}
                max={80}
                value={age}
                onChange={setAge}
                suffix="years"
              />
            </div>
          </div>
        )}

        {/* Step 3: Gender */}
        {step === 3 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-8 space-y-3">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGender(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                    gender === opt.value
                      ? "bg-[var(--fm-green-bg)] border-2 border-[var(--fm-green)] shadow-sm"
                      : "bg-white border-2 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-base font-semibold text-[var(--fm-text-primary)]">
                    {opt.label}
                  </span>
                  {gender === opt.value && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-[var(--fm-green)] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Height */}
        {step === 4 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-6">
              <HeightPicker
                heightCm={heightCm}
                heightFt={heightFt}
                heightIn={heightIn}
                unit={heightUnit}
                onCmChange={setHeightCm}
                onFtInChange={(ft, inch) => {
                  setHeightFt(ft);
                  setHeightIn(inch);
                }}
                onUnitChange={setHeightUnit}
              />
            </div>
          </div>
        )}

        {/* Step 5: Current Weight */}
        {step === 5 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-6">
              <WeightRuler
                value={currentWeightKg}
                onChange={setCurrentWeightKg}
                unit={weightUnit}
                onUnitChange={setWeightUnit}
                label="Current Weight"
              />
            </div>
          </div>
        )}

        {/* Step 6: Target Weight */}
        {step === 6 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-6">
              <WeightRuler
                value={targetWeightKg}
                onChange={setTargetWeightKg}
                unit={weightUnit}
                onUnitChange={setWeightUnit}
                label="Target Weight"
              />
            </div>
          </div>
        )}

        {/* Step 7: Activity Level */}
        {step === 7 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />
            <div className="mt-6 space-y-2.5">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActivityLevel(opt.value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${
                    activityLevel === opt.value
                      ? "bg-[var(--fm-green-bg)] border-2 border-[var(--fm-green)] shadow-sm"
                      : "bg-white border-2 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm text-[var(--fm-text-primary)]">
                      {opt.label}
                    </p>
                    <p className="text-xs text-[var(--fm-text-muted)]">
                      {opt.desc}
                    </p>
                  </div>
                  {activityLevel === opt.value && (
                    <div className="w-5 h-5 rounded-full bg-[var(--fm-green)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Calorie Slider */}
        {step === 8 && (
          <div className="w-full max-w-sm animate-slide-up">
            <StepHeader step={step} />

            {/* Auto-inferred goal badge */}
            <div className="flex justify-center mt-4 mb-2">
              <div className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                inferredGoal === "lose"
                  ? "bg-blue-50 text-blue-600"
                  : inferredGoal === "gain"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-gray-100 text-[var(--fm-text-muted)]"
              }`}>
                {inferredGoal === "lose"
                  ? "🔥 Goal: Lose Weight"
                  : inferredGoal === "gain"
                  ? "💪 Goal: Gain Weight"
                  : "⚖️ Goal: Maintain"}
              </div>
            </div>

            <div className="mt-2">
              <CalorieSlider
                tdee={tdee}
                value={dailyCalories}
                onChange={setDailyCalories}
                goal={inferredGoal}
                currentWeightKg={currentWeightKg}
                targetWeightKg={targetWeightKg}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="px-5 pb-10 pt-4 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--fm-text-secondary)]" />
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={loading || !canProceed()}
          className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 ${
            canProceed()
              ? "btn-green"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          id="onboard-next-btn"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>
              Let&apos;s Go!
              <Sparkles className="w-4 h-4" />
            </>
          ) : step === 0 ? (
            "Get Started"
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--fm-green-bg)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[var(--fm-green)]" />
      </div>
      <h1
        className="text-2xl font-bold text-[var(--fm-text-primary)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {s.title}
      </h1>
      <p className="text-sm text-[var(--fm-text-muted)] mt-1">{s.subtitle}</p>
    </div>
  );
}
