"use client";

import { Users, Lock, ArrowRight, Zap } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function TeamPage() {
  const { user } = useAuthStore();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Community Edition supports 1 seat
          </p>
        </div>

        {/* Members card */}
        <div className="dash-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Members (1 / 1)
          </p>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name ?? "You"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium flex-shrink-0">
              Owner
            </span>
          </div>
        </div>

        {/* Pro upsell */}
        <div className="dash-card border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-2">Invite your team with Pro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
                {[
                  "Up to 10 team members",
                  "Role-based access: Admin, Member, Viewer",
                  "Email invitations with magic links",
                  "Full audit trail of all team actions",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
              <a
                href="https://yusuf545.gumroad.com/l/ttazrg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}