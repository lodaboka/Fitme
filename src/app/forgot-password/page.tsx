"use client";

// ============================================================
// Fit Me v4 — Forgot Password Page (Liquid Glass Theme)
// Email input → triggers Supabase password reset email
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Leaf, CheckCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Detect email provider for "Open Email" button
  const getEmailAppUrl = () => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;
    if (domain === "gmail.com") return "https://mail.google.com";
    if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com")
      return "https://outlook.live.com";
    if (domain === "yahoo.com") return "https://mail.yahoo.com";
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <motion.div
        className="mb-10 flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
          className="w-[72px] h-[72px] rounded-3xl flex items-center justify-center mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.9) 0%, rgba(52,211,153,0.9) 100%)",
            boxShadow: "0 8px 32px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <Leaf className="w-9 h-9 text-white" />
        </motion.div>
        <h1
          className="text-3xl font-bold text-[var(--fm-text-primary)] tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {sent ? "Check Your Email" : "Reset Password"}
        </h1>
        <p className="text-[var(--fm-text-muted)] text-sm mt-1">
          {sent ? "We've sent you a reset link" : "Enter your email to get a reset link"}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {sent ? (
          /* ── Success State ───────────────────────────────── */
          <motion.div
            key="sent"
            className="w-full max-w-sm glass-panel p-6"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="text-center space-y-5">
              <motion.div
                className="w-20 h-20 rounded-full glass-card flex items-center justify-center mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
              >
                <CheckCircle className="w-10 h-10 text-[var(--fm-green)]" />
              </motion.div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                  Password reset link sent to
                </p>
                <div className="px-4 py-2.5 rounded-xl glass-card">
                  <p className="text-sm font-bold text-[var(--fm-green)] break-all">
                    {email}
                  </p>
                </div>
                <p className="text-xs text-[var(--fm-text-muted)] leading-relaxed">
                  Click the link in the email to set your new password.
                </p>
              </div>

              {getEmailAppUrl() && (
                <motion.a
                  href={getEmailAppUrl()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
                  whileTap={{ scale: 0.97 }}
                  id="open-email-btn"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Email App
                </motion.a>
              )}

              <Link
                href="/login"
                className="block w-full h-11 rounded-full glass-card flex items-center justify-center gap-2 text-sm font-semibold text-[var(--fm-text-primary)] hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Email Form ───────────────────────────────── */
          <motion.div
            key="form"
            className="w-full max-w-sm glass-panel p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 h-12 rounded-xl glass-input text-[var(--fm-text-primary)] placeholder:text-[var(--fm-text-muted)]/50 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  className="p-3 rounded-xl glass-card"
                  style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                id="reset-password-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to login */}
      {!sent && (
        <motion.p
          className="mt-6 text-[var(--fm-text-muted)] text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/login"
            className="text-[var(--fm-green)] hover:text-[var(--fm-green-dark)] font-semibold transition-colors"
          >
            ← Back to Sign In
          </Link>
        </motion.p>
      )}
    </div>
  );
}
