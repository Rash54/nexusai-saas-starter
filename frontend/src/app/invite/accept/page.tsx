"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { NexuLogo } from "@/components/ui/NexuLogo";
import { teamApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { isAuthenticated } = useAuthStore();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link — no token found.");
      return;
    }

    if (!isAuthenticated) {
      setStatus("auth_required");
      return;
    }

    teamApi.acceptInvite(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.status === "already_member"
          ? "You're already a member of this organization."
          : "You've successfully joined the team!");
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.detail ?? "This invite may have expired or already been used.");
      });
  }, [token, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="flex justify-center">
          <NexuLogo size="lg" />
        </div>

        <div className="dash-card space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
              <p className="text-sm font-medium">Accepting your invitation...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-lg font-display font-semibold">Welcome to the team!</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-lg font-display font-semibold">Invite Invalid</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link href="/dashboard" className="btn-primary w-full mt-2 inline-flex justify-center">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "auth_required" && (
            <>
              <p className="text-lg font-display font-semibold">Sign in to accept</p>
              <p className="text-sm text-muted-foreground">
                You need to be signed in to accept this invitation.
              </p>
              <Link
                href={`/login?redirect=/invite/accept?token=${token}`}
                className="btn-primary w-full inline-flex justify-center"
              >
                Sign in to continue
              </Link>
              <Link
                href={`/register?redirect=/invite/accept?token=${token}`}
                className="btn-secondary w-full inline-flex justify-center"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Default export wraps in Suspense (required for useSearchParams in Next.js 15) ──
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}