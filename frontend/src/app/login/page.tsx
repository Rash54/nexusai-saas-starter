"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { NexuLogo } from "@/components/ui/NexuLogo";
import axiosInstance, { setAuthToken } from "@/lib/axios";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, setTokens, setOrgId } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);

    try {
      // 1. Get tokens
      const tokenRes = await authApi.login({ username: email, password });
      const { access_token, refresh_token } = tokenRes.data;

      // FIX: set the token on the axios instance immediately so every
      // subsequent call in this function uses it directly — don't wait
      // for the cookie to be committed and re-read by the interceptor.
      // Without this, the next call fires before the cookie is readable
      // and gets a 401, triggering a redundant refresh cycle.
      setAuthToken(access_token);

      // Save to cookies + zustand store (for persistence across page loads)
      setTokens(access_token, refresh_token);

      // 2. Get user profile — now has token directly on instance, no 401
      const userRes = await authApi.me();
      setUser(userRes.data);

      // 3. Fetch orgs — same, token already on instance
      const orgsRes = await axiosInstance.get<{ org_id: string; name: string; role: string }[]>(
        "/users/me/organizations"
      );
      const orgs = orgsRes.data;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].org_id);
      }

      const redirect = params.get("redirect") ?? "/dashboard";
      router.push(redirect);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid email or password";
      setError(typeof msg === "string" ? msg : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="flex flex-col items-start gap-3">
            <NexuLogo size="lg" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mt-4">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Sign in to your NEXU dashboard
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-base h-11"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full h-11 mt-2 text-base font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </motion.button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 bg-sidebar flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 max-w-sm text-center space-y-6"
        >
          <div className="flex justify-center">
            <NexuLogo size="lg" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-white">
              AI-Powered Business Intelligence
            </h2>
            <p className="text-sidebar-foreground/60 text-sm leading-relaxed">
              Revenue insights, growth analytics, anomaly detection and AI recommendations — all in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {["Revenue Analytics", "AI Insights", "Team Collab", "Integrations", "Anomaly Detection"].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/10"
              >
                {f}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { value: "12.5%", label: "Avg Growth Rate" },
              { value: "245", label: "AI Insights/mo" },
              { value: "$82K", label: "Avg MRR Tracked" },
              { value: "8ms", label: "Response Time" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="font-display font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}