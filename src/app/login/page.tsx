"use client";

// ============================================================
// Fit Me v3 — Login Page (Liquid Glass Theme)
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
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
          Fit Me
        </h1>
        <p className="text-[var(--fm-text-muted)] text-sm mt-1">
          Smart dietary tracking, powered by AI
        </p>
      </motion.div>

      {/* Login Card — glass panel */}
      <motion.div
        className="w-full max-w-sm glass-panel p-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[var(--fm-text-secondary)] text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
              <input
                id="email"
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
            <label htmlFor="password" className="text-[var(--fm-text-secondary)] text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fm-text-muted)]" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
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
            id="login-btn"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Signup Link */}
      <motion.p
        className="mt-6 text-[var(--fm-text-muted)] text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[var(--fm-green)] hover:text-[var(--fm-green-dark)] font-semibold transition-colors"
        >
          Sign up free
        </Link>
      </motion.p>
    </div>
  );
}
