"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, AlertTriangle, Info,
  CheckCircle2, X, Trash2, Plus, Filter,
  Activity, TrendingDown, Zap,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import {
  useNotifications, useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useApi";
import type { Notification } from "@/types";

const LEVEL_META = {
  critical: { icon: AlertTriangle, color: "text-red-500",   bg: "bg-red-500/10 border-red-500/20" },
  warning:  { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  info:     { icon: Info,          color: "text-blue-500",  bg: "bg-blue-500/10 border-blue-500/20" },
  success:  { icon: CheckCircle2,  color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

// Mock notifications
const MOCK_NOTIFS: Notification[] = [
  { id: "1", type: "anomaly", level: "critical", title: "MRR Drop Detected", message: "MRR dropped by 8.2% compared to last week — unusually high churn this Monday.", is_read: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "2", type: "ai_insight", level: "warning", title: "Retention Alert", message: "Day-7 retention dropped below 50% threshold for the March cohort.", is_read: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "3", type: "integration", level: "warning", title: "GA4 Sync Failed", message: "Google Analytics 4 token expired. Please reconnect the integration.", is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), action_url: "/integrations", action_label: "Reconnect" },
  { id: "4", type: "team", level: "info", title: "Emma joined the team", message: "Emma Uploads accepted your invitation and joined as a Member.", is_read: true, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "5", type: "ai_insight", level: "success", title: "AI Insight Generated", message: "Revenue analysis for March is ready. 18% growth driven by mobile conversions.", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "6", type: "upload", level: "success", title: "Upload Processed", message: "Sales_Data.csv has been parsed and AI insights are ready to view.", is_read: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
];

const ALERT_RULES = [
  { id: "r1", name: "MRR Drop Alert", metric: "mrr", condition: "change_pct", threshold: "-5", severity: "critical", channels: ["in_app", "email"], is_active: true },
  { id: "r2", name: "Churn Spike", metric: "churn_rate", condition: "above", threshold: "6", severity: "warning", channels: ["in_app"], is_active: true },
  { id: "r3", name: "Runway Warning", metric: "runway_months", condition: "below", threshold: "12", severity: "critical", channels: ["in_app", "email"], is_active: false },
];

function NotifCard({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  const meta = LEVEL_META[notif.level] ?? LEVEL_META.info;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all",
        !notif.is_read ? meta.bg : "border-border hover:bg-accent/30"
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
        <Icon className={cn("w-4 h-4", meta.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{notif.title}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(notif.created_at)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>

        <div className="flex items-center gap-3 mt-2.5">
          {notif.action_url && (
            <a href={notif.action_url} className="text-xs text-primary font-medium hover:underline">
              {notif.action_label ?? "View"}
            </a>
          )}
          {!notif.is_read && (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Mark read
            </button>
          )}
        </div>
      </div>

      {!notif.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showNewRule, setShowNewRule] = useState(false);

  const { data: notifData } = useNotifications(filter === "unread");
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notifData?.notifications?.length ? notifData.notifications : MOCK_NOTIFS;
  const unreadCount = notifData?.unread_count ?? MOCK_NOTIFS.filter(n => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stay on top of anomalies, insights, and team activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={() => markAllRead.mutate()} className="btn-secondary h-9 text-sm gap-1.5">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unread", value: unreadCount, color: "text-primary", bg: "bg-primary/10" },
          { label: "Critical", value: MOCK_NOTIFS.filter(n => n.level === "critical").length, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Warnings", value: MOCK_NOTIFS.filter(n => n.level === "warning").length, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Total", value: MOCK_NOTIFS.length, color: "text-muted-foreground", bg: "bg-muted" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="dash-card flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
              <Bell className={cn("w-4 h-4", s.color)} />
            </div>
            <div>
              <p className={cn("text-xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {(["all", "unread"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                {f}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCheck className="w-12 h-12 text-emerald-500 mb-3" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No unread notifications</p>
                </div>
              ) : (
                filtered.map(n => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Alert Rules */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="dash-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Alert Rules</h2>
              </div>
              <button onClick={() => setShowNewRule(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> New rule
              </button>
            </div>

            <div className="space-y-3">
              {ALERT_RULES.map((rule, i) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={cn("p-3 rounded-xl border transition-all",
                    rule.is_active ? "border-border bg-muted/30" : "border-border/50 bg-muted/10 opacity-60")}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold">{rule.name}</p>
                    <div className="flex items-center gap-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                        rule.severity === "critical" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>
                        {rule.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Alert when <span className="font-medium text-foreground">{rule.metric}</span>{" "}
                    {rule.condition === "above" ? "goes above" : rule.condition === "below" ? "drops below" : "changes by"}{" "}
                    <span className="font-medium text-foreground">{rule.threshold}{rule.condition === "change_pct" ? "%" : ""}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      {rule.channels.map(ch => (
                        <span key={ch} className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">{ch.replace("_", " ")}</span>
                      ))}
                    </div>
                    {/* Toggle */}
                    <div className={cn("w-8 h-4 rounded-full transition-colors flex items-center px-0.5 cursor-pointer",
                      rule.is_active ? "bg-primary justify-end" : "bg-muted justify-start")}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
