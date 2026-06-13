"use client";

// ============================================================
// Fit Me v4 — Update Password Page (Liquid Glass Theme)
// User arrives here from the password reset email link.
// Sets new password, then redirects to dashboard.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Leaf, Check, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Wait for the Supabase session from the recovery link
  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes — the recovery link auto-sets the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );

    // Also check if already in a session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to dashboard after a brief success animation
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
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
          {success ? "Password Updated!" : "New Password"}
        </h1>
        <p className="text-[var(--fm-text-muted)] text-sm mt-1">
          {success ? "Redirecting to your dashboard..." : "Choose a strong new password"}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {success ? (
          /* ── Success State ───────────────────────────────── */
          <motion.div
            key="success"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center animate-glass-orb">
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
          </motion.div>
        ) : (
          /* ── Password Form ───────────────────────────────── */
          <motion.div
            key="form"
            className="w-full max-w-sm glass-panel p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          >
            {!sessionReady ? (
              <div className="text-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--fm-green)]/30 border-t-[var(--fm-green)] animate-spin mx-auto mb-3" />
                <p className="text-sm text-[var(--fm-text-muted)]">
                  Verifying your reset link...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 h-12 rounded-xl glass-input text-[var(--fm-text-primary)] placeholder:text-[var(--fm-text-muted)]/50 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--fm-text-muted)] hover:text-[var(--fm-text-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-[var(--fm-text-secondary)] text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 h-12 rounded-xl glass-input text-[var(--fm-text-primary)] placeholder:text-[var(--fm-text-muted)]/50 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {password === confirmPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--fm-green)]" />
                        <span className="text-xs text-[var(--fm-green)] font-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400" />
                        <span className="text-xs text-red-400 font-medium">Passwords don&apos;t match</span>
                      </>
                    )}
                  </motion.div>
                )}

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
                  disabled={loading || password !== confirmPassword}
                  className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  id="update-password-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Update Password
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
