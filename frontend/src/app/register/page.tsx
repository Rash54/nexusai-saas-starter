"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { NexuLogo } from "@/components/ui/NexuLogo";
import axiosInstance, { setAuthToken } from "@/lib/axios";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains number", test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setTokens, setOrgId } = useAuthStore();

  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Register
      await authApi.register(form);

      // 2. Auto-login
      const tokenRes = await authApi.login({ username: form.email, password: form.password });
      setAuthToken(tokenRes.data.access_token);
      setTokens(tokenRes.data.access_token, tokenRes.data.refresh_token);

      // 3. Get user profile
      const userRes = await authApi.me();
      setUser(userRes.data);

      // 4. Fetch the auto-created org and set it as active
      const orgsRes = await axiosInstance.get<{ org_id: string; name: string; role: string }[]>(
        "/users/me/organizations"
      );
      const orgs = orgsRes.data;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].org_id);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed";
      setError(typeof msg === "string" ? msg : "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="flex flex-col items-start gap-3">
          <NexuLogo size="lg" />
          <div>
            <h1 className="text-2xl font-display font-bold mt-4">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Start with NEXU AI — free forever.
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
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={set("full_name")}
              placeholder="Alex Johnson"
              className="input-base h-11"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@company.com"
              className="input-base h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Create a strong password"
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

            {form.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5 pt-1"
              >
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? "bg-emerald-500" : "bg-muted"}`}>
                        {passed && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-xs ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading || !form.email || !form.password || !form.full_name}
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
                Creating account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </motion.button>

          <p className="text-xs text-muted-foreground text-center">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}