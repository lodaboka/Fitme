"use client";

// ============================================================
// Fit Me v3 — Signup Page (Liquid Glass Theme)
// After signup → email verification screen (no auto-redirect)
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Leaf, User, CheckCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      // Show the email verification screen — no auto-redirect
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setResending(false);
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
    if (domain === "icloud.com" || domain === "me.com") return "https://www.icloud.com/mail";
    return `https://mail.${domain}`; // generic fallback
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Logo — glass orb */}
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
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Leaf className="w-9 h-9 text-white" />
        </motion.div>
        <h1
          className="text-3xl font-bold text-[var(--fm-text-primary)] tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {success ? "Check Your Email" : "Join Fit Me"}
        </h1>
        <p className="text-[var(--fm-text-muted)] text-sm mt-1">
          {success
            ? "One more step to get started"
            : "Start tracking your nutrition today"}
        </p>
      </motion.div>

      {/* Signup / Verification Card — glass panel */}
      <AnimatePresence mode="wait">
        {success ? (
          /* ── Email Verification Screen ─────────────────────── */
          <motion.div
            key="verify"
            className="w-full max-w-sm glass-panel p-6"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="text-center space-y-5">
              {/* Animated mail icon */}
              <motion.div
                className="w-20 h-20 rounded-full glass-card flex items-center justify-center mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Mail className="w-10 h-10 text-[var(--fm-green)]" />
                </motion.div>
              </motion.div>

              {/* Explanation text */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--fm-text-primary)]">
                  We&apos;ve sent a confirmation link to
                </p>
                <div className="px-4 py-2.5 rounded-xl glass-card">
                  <p className="text-sm font-bold text-[var(--fm-green)] break-all">
                    {email}
                  </p>
                </div>
                <p className="text-xs text-[var(--fm-text-muted)] leading-relaxed">
                  Click the link in the email to verify your account.
                  Once verified, you&apos;ll be taken straight to setting up your profile.
                </p>
              </div>

              {/* Open Email App button */}
              {getEmailAppUrl() && (
                <motion.a
                  href={getEmailAppUrl()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  id="open-email-btn"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Email App
                </motion.a>
              )}

              {/* Resend email */}
              <div className="pt-1">
                {resent ? (
                  <motion.p
                    className="text-xs font-semibold text-[var(--fm-green)] flex items-center justify-center gap-1.5"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verification email resent!
                  </motion.p>
                ) : (
                  <button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="text-xs text-[var(--fm-text-muted)] hover:text-[var(--fm-text-primary)] transition-colors disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Didn\u0027t receive it? Resend email"}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[10px] text-[var(--fm-text-muted)] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {/* Go to sign in link */}
              <Link
                href="/login"
                className="block w-full h-11 rounded-full glass-card flex items-center justify-center gap-2 text-sm font-semibold text-[var(--fm-text-primary)] hover:shadow-md transition-all duration-200"
                id="goto-signin-btn"
              >
                Already verified? Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Signup Form ─────────────────────────────────── */
          <motion.div
            key="form"
            className="w-full max-w-sm glass-panel p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          >
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 h-12 rounded-xl glass-input text-[var(--fm-text-primary)] placeholder:text-[var(--fm-text-muted)]/50 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 h-12 rounded-xl glass-input text-[var(--fm-text-primary)] placeholder:text-[var(--fm-text-muted)]/50 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                id="signup-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Link */}
      {!success && (
        <motion.p
          className="mt-6 text-[var(--fm-text-muted)] text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--fm-green)] hover:text-[var(--fm-green-dark)] font-semibold transition-colors"
          >
            Sign in
          </Link>
        </motion.p>
      )}
    </div>
  );
}

