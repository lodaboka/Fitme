"use client";

// ============================================================
// Fit Me v3 — Snap Uploader (Liquid Glass Theme)
// Glass upload cards, animated processing overlay with
// phase-shifting text. Core image logic UNTOUCHED.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SnapUploaderProps {
  onResult: (data: any, preview: string, originalFile: File) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

type ProcessingPhase = "resizing" | "analyzing" | "idle";

const PHASE_MESSAGES = [
  { text: "Analyzing image...", sub: "Multi-AI pipeline active" },
  { text: "Calculating macros...", sub: "Identifying ingredients" },
  { text: "Finalizing results...", sub: "Cross-referencing nutrition data" },
];

export default function SnapUploader({
  onResult,
  isProcessing,
  setIsProcessing,
}: SnapUploaderProps) {
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ProcessingPhase>("idle");
  const [messageIndex, setMessageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cycle through analysis messages
  useEffect(() => {
    if (phase !== "analyzing") return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PHASE_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase]);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setPhase("resizing");

    try {
      // Step 1: Generate preview from ORIGINAL file (no compression)
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Step 2: "Smart Resize" using HTML5 Canvas API (Zero Cropping)
      // Scale down so the longest side is exactly 800px.
      const base64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 (remove the data:image/jpeg;base64, prefix)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const base64String = dataUrl.split(",")[1];
          resolve(base64String);
        };
        img.onerror = () => reject(new Error("Failed to load image for resizing"));
        img.src = previewUrl;
      });

      setPhase("analyzing");
      setMessageIndex(0);
      const localHour = new Date().getHours();

      // Step 3: Call API with the 800px smart-resized image
      const res = await fetch("/api/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType: "image/jpeg", // We strictly output image/jpeg from the Canvas API
          localHour,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();

      // Step 4: Pass original file to parent for post-processing
      // (parent will handle compression + Supabase upload)
      onResult(data, previewUrl, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
      setPhase("idle");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload area — glass option cards */}
      {!preview && !isProcessing ? (
        <motion.div
          className="glass-panel overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Large upload zone */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-all duration-200 group"
            whileTap={{ scale: 0.98 }}
            id="snap-upload-zone"
          >
            <motion.div
              className="w-20 h-20 rounded-full glass-panel flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ImageIcon className="w-9 h-9 text-[var(--fm-green)]" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                Upload a meal photo
              </p>
              <p className="text-xs text-[var(--fm-text-muted)] mt-1">
                AI will identify the food and calculate macros
              </p>
            </div>
          </motion.button>

          {/* Action buttons — glass-styled */}
          <div className="flex border-t border-white/10">
            <motion.button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-4 min-h-[48px] hover:bg-white/5 transition-all duration-200 border-r border-white/10"
              whileTap={{ scale: 0.95 }}
              id="snap-camera-btn"
            >
              <Camera className="w-4 h-4 text-[var(--fm-green)]" />
              <span className="text-sm font-medium text-[var(--fm-green)]">
                Camera
              </span>
            </motion.button>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-4 min-h-[48px] hover:bg-white/5 transition-all duration-200"
              whileTap={{ scale: 0.95 }}
              id="snap-gallery-btn"
            >
              <Upload className="w-4 h-4 text-[var(--fm-text-muted)]" />
              <span className="text-sm font-medium text-[var(--fm-text-secondary)]">
                Gallery
              </span>
            </motion.button>
          </div>
        </motion.div>
      ) : isProcessing ? (
        /* Processing state — premium glass overlay */
        <motion.div
          className="glass-panel overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {preview && (
            <div className="relative aspect-[4/3]">
              <img
                src={preview}
                alt="Meal being analyzed"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center">
                {/* Animated ring spinner — glass-aware */}
                <div className="relative w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-white/80 animate-spin"
                    style={{ animationDuration: "1s" }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-[var(--fm-green-light)] animate-spin"
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "0.7s",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                  </div>
                </div>

                {/* Phase indicator with crossfade */}
                <div className="text-center space-y-2 h-14">
                  <AnimatePresence mode="wait">
                    {phase === "resizing" ? (
                      <motion.div
                        key="resizing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-white font-semibold text-sm tracking-wide">
                          Optimizing image...
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          Compressing via Canvas API
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`analyzing-${messageIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-white font-semibold text-sm tracking-wide">
                          {PHASE_MESSAGES[messageIndex].text}
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          {PHASE_MESSAGES[messageIndex].sub}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Glass shimmer bars */}
                <div className="mt-5 space-y-2 w-52">
                  <div className="h-3 glass-skeleton w-3/4 mx-auto" />
                  <div className="h-2 glass-skeleton w-1/2 mx-auto" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Error — glass-styled */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="p-4 rounded-2xl glass-panel border border-red-400/20"
            style={{ background: "rgba(239, 68, 68, 0.08)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setPreview("");
              }}
              className="text-xs text-red-300 mt-2 underline hover:text-red-200 transition-colors duration-200"
              id="snap-retry-btn"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="snap-file-input"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        id="snap-camera-input"
      />
    </div>
  );
}
