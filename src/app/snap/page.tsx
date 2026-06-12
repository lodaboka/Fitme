"use client";

// ============================================================
// Fit Me v3 — Snap Page (Liquid Glass Theme)
// Upload → AI Analyze → Compress → Store → Save
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import SnapUploader from "@/components/SnapUploader";
import MealResultCard from "@/components/MealResultCard";
import Navbar from "@/components/Navbar";
import { SnapResponse, MealCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function SnapPage() {
  const router = useRouter();
  const [result, setResult] = useState<SnapResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [loggedCategory, setLoggedCategory] = useState<MealCategory | undefined>(
    undefined
  );

  const handleResult = async (data: any, preview: string, originalFile: File) => {
    setResult(data.analysis as SnapResponse);
    setLoggedCategory(data.log?.meal_category as MealCategory);
    setLogId(data.logId || data.log?.id || null);
    setImagePreview(preview);

    // After successful AI analysis, compress and upload to Supabase Storage
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !data.logId) return;

      // Heavy compress for storage
      let compressedFile = originalFile;
      if (typeof window !== "undefined") {
        try {
          const imageCompression = (await import("browser-image-compression")).default;
          compressedFile = await imageCompression(originalFile, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          });
        } catch {
          console.warn("Heavy compression failed, using original");
        }
      }

      // Upload to Supabase Storage
      const ext = compressedFile.name?.split(".").pop() || "jpg";
      const filePath = `${user.id}/${data.logId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("food-snaps")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.warn("Image upload failed:", uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("food-snaps")
        .getPublicUrl(filePath);

      // Update food_logs row with image_url
      if (urlData?.publicUrl) {
        await supabase
          .from("food_logs")
          .update({ image_url: urlData.publicUrl })
          .eq("id", data.logId);
      }
    } catch (err) {
      console.warn("Image storage failed (non-blocking):", err);
    }
  };

  const handleSaved = () => {
    setSaved(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 px-5 pt-14 pb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--fm-text-primary)]" />
        </Link>
        <div>
          <h1
            className="text-xl font-bold text-[var(--fm-text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Snap Your Meal
          </h1>
          <p className="text-[var(--fm-text-muted)] text-xs">
            Take a photo and let AI do the rest
          </p>
        </div>
      </motion.div>

      {/* Success State */}
      {saved ? (
        <motion.div
          className="flex flex-col items-center justify-center py-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-4 animate-glass-orb">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M10 20l8 8 12-16"
                stroke="var(--fm-green)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw-check"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--fm-text-primary)] mb-1">Meal Logged!</h2>
          <p className="text-[var(--fm-text-muted)] text-sm">
            Redirecting to dashboard...
          </p>
        </motion.div>
      ) : (
        <div className="px-5 space-y-6">
          {/* Upload Area */}
          {!result && (
            <SnapUploader
              onResult={handleResult}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}

          {/* Results */}
          {result && !isProcessing && (
            <div className="flex flex-col items-center">
              <MealResultCard
                result={result}
                imagePreview={imagePreview}
                onSaved={handleSaved}
                loggedCategory={loggedCategory}
              />
            </div>
          )}
        </div>
      )}

      <Navbar />
    </div>
  );
}
