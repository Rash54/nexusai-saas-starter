"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, TrendingUp, Activity, AlertTriangle,
  BarChart2, Upload, ChevronRight, CheckCircle2,
  Circle, RefreshCw, ExternalLink,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import Link from "next/link";
import { cn, formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  useDashboard, useMetricTrend, useRecommendations,
  useIntegrations, useHealthScore, useAnomalies,
} from "@/hooks/useApi";

// ── Mock spark data ───────────────────────────────────────
const genSpark = (base: number, len = 12) =>
  Array.from({ length: len }, (_, i) => ({
    value: base + Math.sin(i * 0.7) * base * 0.12 + Math.random() * base * 0.08,
  }));

// ── Revenue chart mock (replace with real trend data) ─────
const revenueData = [
  { date: "Jan 1", revenue: 18000 },
  { date: "Jan 8", revenue: 19200 },
  { date: "Jan 15", revenue: 18800 },
  { date: "Jan 22", revenue: 20100 },
  { date: "Feb 1", revenue: 21500 },
  { date: "Feb 8", revenue: 20800 },
  { date: "Feb 15", revenue: 22400 },
  { date: "Feb 22", revenue: 23100 },
  { date: "Mar 1", revenue: 22800 },
  { date: "Mar 8", revenue: 24300 },
];

// ── Team performance bar data ─────────────────────────────
const teamData = [
  { month: "Oct", tasks: 42 },
  { month: "Nov", tasks: 58 },
  { month: "Dec", tasks: 51 },
  { month: "Jan", tasks: 67 },
  { month: "Feb", tasks: 73 },
  { month: "Mar", tasks: 81 },
];

const REVENUE_PERIODS = ["7D", "30D", "90D"] as const;

// ── Custom tooltip ────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [revPeriod, setRevPeriod] = useState<"7D" | "30D" | "90D">("30D");

  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: recs } = useRecommendations();
  const { data: integrations } = useIntegrations();
  const { data: healthScore } = useHealthScore();
  const { data: anomalies } = useAnomalies();

  const isLoading = dashLoading;

  // Recent activity mock
  const recentActivity = [
    { icon: CheckCircle2, color: "text-emerald-500", text: "New dataset uploaded", time: "2m ago" },
    { icon: AlertTriangle, color: "text-amber-500", text: 'AI Insight: "User churn increased"', time: "14m ago" },
    { icon: Circle, color: "text-blue-500", text: "Emma joined the team", time: "1h ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back — here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {healthScore && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold",
              healthScore.grade === "A" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
              healthScore.grade === "B" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
              "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            )}>
              <span>Health Score</span>
              <span className="font-display">{healthScore.total_score.toFixed(0)}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Total Revenue"
          value={dashboard?.mrr ?? 82450}
          format="currency"
          change={dashboard?.mrr_growth_pct ?? 18}
          changeLabel="this month"
          sparkData={genSpark(82450)}
          colorVariant="purple"
          delay={0}
        />
        <StatCard
          title="Growth Rate"
          value={`${(dashboard?.mrr_growth_pct ?? 12.5).toFixed(1)}%`}
          change={dashboard?.mrr_growth_pct ?? 12.5}
          changeLabel="Up"
          sparkData={genSpark(12.5)}
          colorVariant="green"
          delay={0.05}
        />
        <StatCard
          title="AI Insights Generated"
          value={245}
          format="number"
          sparkData={genSpark(245)}
          colorVariant="blue"
          highlighted
          icon={<Sparkles className="w-4 h-4 text-blue-400" />}
          delay={0.1}
        />
        <StatCard
          title="Active Metrics"
          value={`${dashboard?.total_customers ?? 32} Metrics`}
          sparkData={genSpark(32)}
          colorVariant="cyan"
          delay={0.15}
        />
        <StatCard
          title="Anomalies Detected"
          value={`${anomalies?.anomalies_detected ?? 8} Issues`}
          sparkData={genSpark(8)}
          colorVariant="rose"
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          delay={0.2}
        />
      </div>

      {/* ── AI Insights banner + Correlation Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 dash-card relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(222 47% 10%) 0%, hsl(232 50% 14%) 100%)",
          }}
        >
          {/* Subtle bg orb */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">
                <span className="text-white">AI Insights</span>{" "}
                <span className="text-muted-foreground font-normal text-base">for Your Business</span>
              </h2>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { text: 'Revenue increased by 18% due to higher conversion on', highlight: 'mobile users."' },
                { text: 'Unusual drop in retention detected on', highlight: 'March 12."' },
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-white">{insight.text}</span>{" "}
                    <span className="text-primary">{insight.highlight}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/ai-insights">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary text-sm px-4 py-2"
                >
                  View Full Analysis
                </motion.button>
              </Link>
              <button className="btn-secondary text-sm px-4 py-2">
                Generate Recommendation
              </button>
              <span className="ml-auto text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                Powered by NEXU AI <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </motion.div>

        {/* Correlation Insights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Correlation Insights</h2>
            <Link href="/correlations">
              <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Traffic → Revenue",
                items: ["Traffic ↑", "Revenue ↑"],
                color: "bg-emerald-500",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                label: "Revenue + Conversions",
                items: ["Revenue ↑✓", "Conversions ↓"],
                color: "bg-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                label: "Ad Spend — Needs Attention",
                items: ["Ad Spend ↓", "Conversions ↓"],
                color: "bg-red-500",
                bg: "bg-red-500/10 border-red-500/20",
                alert: true,
              },
            ].map((c) => (
              <div
                key={c.label}
                className={cn("rounded-xl p-3 border", c.bg)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {c.items.map((item) => (
                    <span key={item} className="text-xs font-medium">{item}</span>
                  ))}
                </div>
                {c.alert && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Needs Attention</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Revenue chart + Activity + Upload ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Analytics chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-1 dash-card"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold">Revenue Analytics</h2>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {REVENUE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRevPeriod(p)}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-all",
                    revPeriod === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="stat-value text-xl">{formatCurrency(24300)}</p>
            <p className="text-xs text-emerald-500 font-medium">+12.4% Past 30 Days</p>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <button className="text-xs text-primary hover:underline">See all</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <a.icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", a.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upload Data CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Upload Data</h2>
            <Link href="/upload">
              <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>
          <Link href="/upload">
            <div className="flex flex-col items-center justify-center gap-3 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Drag & Drop or Browse Files
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── Integration status + Team Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Integration Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Integration Status</h2>
            <Link href="/integrations">
              <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>

          <div className="space-y-3">
            {(integrations ?? [
              { provider: "stripe", name: "Stripe", status: "active", is_connected: true },
              { provider: "google_analytics", name: "Google Analytics", status: "error", is_connected: true, last_error: "Sync Issue" },
              { provider: "hubspot", name: "HubSpot", status: "disconnected", is_connected: false },
            ]).slice(0, 5).map((intg) => (
              <div key={intg.provider} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border",
                    intg.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                    intg.status === "error" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-muted border-border text-muted-foreground"
                  )}>
                    {intg.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{intg.name}</span>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  intg.status === "active" ? "text-emerald-500" :
                  intg.status === "error" ? "text-amber-500" :
                  "text-muted-foreground"
                )}>
                  {intg.status === "active" ? "Connected" :
                   intg.status === "error" ? (intg.last_error ?? "Sync Issue") :
                   "Not Linked"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team Performance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Team Performance</h2>
            <Link href="/team">
              <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>

          <div className="mb-3">
            <p className="stat-value text-xl">{formatNumber(6120)}</p>
            <p className="text-xs text-emerald-500 font-medium">
              ↑ 85% Task Completion
            </p>
          </div>

          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Recommendations ── */}
      {recs && recs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">AI Recommendations</h2>
            </div>
            <Link href="/ai-insights" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recs.slice(0, 3).map((rec, i) => (
              <div
                key={rec.id}
                className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
                  i === 0 ? "bg-blue-500/10" : i === 1 ? "bg-amber-500/10" : "bg-emerald-500/10"
                )}>
                  {i === 0 ? <BarChart2 className="w-4 h-4 text-blue-500" /> :
                   i === 1 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                   <TrendingUp className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs font-semibold mb-1">{rec.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{rec.summary}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
