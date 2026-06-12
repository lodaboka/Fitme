"use client";

// ============================================================
// Fit Me v2 — Signup Page (White/Green Theme)
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Leaf, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      setSuccess(true);
      setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-[var(--background)]">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center animate-fade-in">
        <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-[var(--fm-green)] to-[var(--fm-green-light)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--fm-green)]/20">
          <Leaf className="w-9 h-9 text-white" />
        </div>
        <h1
          className="text-3xl font-bold text-[var(--fm-text-primary)] tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Join Fit Me
        </h1>
        <p className="text-[var(--fm-text-muted)] text-sm mt-1">
          Start tracking your nutrition today
        </p>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-sm card-elevated p-6 animate-slide-up">
        {success ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--fm-green-bg)] flex items-center justify-center mx-auto mb-3">
              <ArrowRight className="w-7 h-7 text-[var(--fm-green)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--fm-text-primary)] mb-1">
              Welcome aboard!
            </h3>
            <p className="text-[var(--fm-text-muted)] text-sm">
              Redirecting to setup your goals...
            </p>
          </div>
        ) : (
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
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border border-gray-200 text-[var(--fm-text-primary)] placeholder:text-gray-300 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
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
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border border-gray-200 text-[var(--fm-text-primary)] placeholder:text-gray-300 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
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
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border border-gray-200 text-[var(--fm-text-primary)] placeholder:text-gray-300 focus:border-[var(--fm-green)] focus:ring-2 focus:ring-[var(--fm-green)]/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full btn-green flex items-center justify-center gap-2 text-sm"
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
            </button>
          </form>
        )}
      </div>

      {/* Login Link */}
      <p className="mt-6 text-[var(--fm-text-muted)] text-sm animate-fade-in">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--fm-green)] hover:text-[var(--fm-green-dark)] font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
