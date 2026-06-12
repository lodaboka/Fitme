"use client";

// ============================================================
// Fit Me v2.1 — Snap Uploader Component
// Fixed: Sends UNCOMPRESSED image to Gemini AI, then compresses
// for Supabase storage AFTER successful analysis
// ============================================================

import { useState, useRef } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";

interface SnapUploaderProps {
  onResult: (data: any, preview: string, originalFile: File) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

export default function SnapUploader({
  onResult,
  isProcessing,
  setIsProcessing,
}: SnapUploaderProps) {
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

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

      // Step 5: Pass original file to parent for post-processing
      // (parent will handle compression + Supabase upload)
      onResult(data, previewUrl, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!preview && !isProcessing ? (
        <div className="card-elevated overflow-hidden">
          {/* Large upload zone */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--fm-green-bg)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="w-9 h-9 text-[var(--fm-green)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                Upload a meal photo
              </p>
              <p className="text-xs text-[var(--fm-text-muted)] mt-1">
                AI will identify the food and calculate macros
              </p>
            </div>
          </button>

          {/* Action buttons */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 hover:bg-[var(--fm-green-bg)] transition-colors border-r border-gray-100"
            >
              <Camera className="w-4 h-4 text-[var(--fm-green)]" />
              <span className="text-sm font-medium text-[var(--fm-green)]">
                Camera
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4 text-[var(--fm-text-muted)]" />
              <span className="text-sm font-medium text-[var(--fm-text-secondary)]">
                Gallery
              </span>
            </button>
          </div>
        </div>
      ) : isProcessing ? (
        /* Processing state — skeleton loader */
        <div className="card-elevated overflow-hidden">
          {preview && (
            <div className="relative aspect-[4/3]">
              <img
                src={preview}
                alt="Meal"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                {/* Pulsing ring spinner */}
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--fm-green-light)] animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
                </div>
                {/* Skeleton text bars */}
                <div className="space-y-2 w-48">
                  <div className="h-4 skeleton-pulse w-3/4 mx-auto" style={{ background: "rgba(255,255,255,0.2)", borderRadius: "6px" }} />
                  <div className="h-3 skeleton-pulse w-1/2 mx-auto" style={{ background: "rgba(255,255,255,0.12)", borderRadius: "6px" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 animate-slide-up">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setPreview("");
            }}
            className="text-xs text-red-400 mt-2 underline"
          >
            Try again
          </button>
        </div>
      )}

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
