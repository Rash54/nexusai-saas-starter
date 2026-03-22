"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  AlertTriangle, Calendar, Download, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useRevenueSummary, useRevenueForecast, useMetricTrend } from "@/hooks/useApi";

// ── Mock data ─────────────────────────────────────────────
const mrrHistory = [
  { month: "Sep", mrr: 17200 }, { month: "Oct", mrr: 18100 },
  { month: "Nov", mrr: 19400 }, { month: "Dec", mrr: 20800 },
  { month: "Jan", mrr: 21900 }, { month: "Feb", mrr: 23100 },
  { month: "Mar", mrr: 24300 },
];

const waterfallData = [
  { name: "Starting MRR", value: 23100, type: "base" },
  { name: "New", value: 3200, type: "positive" },
  { name: "Expansion", value: 1100, type: "positive" },
  { name: "Contraction", value: -480, type: "negative" },
  { name: "Churn", value: -2620, type: "negative" },
  { name: "Ending MRR", value: 24300, type: "base" },
];

const forecastData = [
  { month: "Apr", base: 24300, low: 23100, high: 25500 },
  { month: "May", base: 25800, low: 24200, high: 27400 },
  { month: "Jun", base: 27400, low: 25100, high: 29700 },
  { month: "Jul", base: 29200, low: 26200, high: 32200 },
  { month: "Aug", base: 31100, low: 27200, high: 35000 },
  { month: "Sep", base: 33200, low: 28100, high: 38400 },
];

const revenueEvents = [
  { type: "new", label: "New Subscription", customer: "Acme Corp", amount: 899, date: "Mar 18" },
  { type: "expansion", label: "Plan Upgrade", customer: "Globex Inc", amount: 400, date: "Mar 17" },
  { type: "churn", label: "Cancellation", customer: "Initech Ltd", amount: -299, date: "Mar 16" },
  { type: "new", label: "New Subscription", customer: "Umbrella Co", amount: 599, date: "Mar 15" },
  { type: "contraction", label: "Plan Downgrade", customer: "Stark Ind", amount: -180, date: "Mar 14" },
];

const PERIODS = ["7D", "30D", "90D", "1Y"] as const;

function StatCard({ title, value, change, sub, icon: Icon, color }: {
  title: string; value: string; change?: number; sub?: string;
  icon: React.FC<{ className?: string }>; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-card"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="stat-value text-xl">{value}</p>
      {change !== undefined && (
        <p className={cn("text-xs font-medium mt-1 flex items-center gap-1",
          change >= 0 ? "text-emerald-500" : "text-red-500")}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(Math.abs(change))} {sub}
        </p>
      )}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>("30D");
  const { data: summary } = useRevenueSummary(30);
  const { data: forecast } = useRevenueForecast(6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Revenue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">MRR breakdown, forecast & runway analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {p}
              </button>
            ))}
          </div>
          <button className="btn-secondary h-9 text-sm gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Net New MRR" value={formatCurrency(summary?.net_new_mrr ?? 1200)} change={12.4} sub="vs last month" icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard title="New MRR" value={formatCurrency(summary?.new_mrr ?? 3200)} change={8.2} sub="new subs" icon={DollarSign} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Churned MRR" value={formatCurrency(summary?.churned_mrr ?? 2620)} change={-4.1} sub="vs last month" icon={TrendingDown} color="bg-red-500/10 text-red-500" />
        <StatCard title="Ending MRR" value={formatCurrency(summary?.ending_mrr ?? 24300)} change={5.2} sub="this month" icon={Users} color="bg-primary/10 text-primary" />
      </div>

      {/* MRR trend + Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MRR Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">MRR Growth</h2>
              <p className="text-xs text-muted-foreground">7-month trend</p>
            </div>
            <span className="badge-success">+5.2% MoM</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(234 89% 62%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="hsl(234 89% 62%)" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ r: 4, fill: "hsl(234 89% 62%)", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* MRR Waterfall */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">MRR Waterfall</h2>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${Math.abs(v) / 1000}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(Math.abs(v)), ""]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.type === "positive" ? "hsl(142 71% 45%)" :
                      entry.type === "negative" ? "hsl(0 84% 60%)" :
                      "hsl(var(--primary))"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Forecast + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR Forecast */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2 dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">MRR Forecast</h2>
              <p className="text-xs text-muted-foreground">6-month projection with confidence bands</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">Linear model</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(234 89% 62%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="high" name="Upper bound" stroke="transparent" fill="url(#bandGrad)" />
                <Area type="monotone" dataKey="low" name="Lower bound" stroke="transparent" fill="hsl(var(--background))" />
                <Line type="monotone" dataKey="base" name="Projected MRR" stroke="hsl(234 89% 62%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(234 89% 62%)" }} strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue events */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Events</h2>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {revenueEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
                  ev.type === "new" ? "bg-emerald-500/10 text-emerald-500" :
                  ev.type === "expansion" ? "bg-blue-500/10 text-blue-500" :
                  ev.type === "churn" ? "bg-red-500/10 text-red-500" :
                  "bg-amber-500/10 text-amber-500")}>
                  {ev.type === "new" ? "+" : ev.type === "expansion" ? "↑" : ev.type === "churn" ? "✕" : "↓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ev.customer}</p>
                  <p className="text-[10px] text-muted-foreground">{ev.label} · {ev.date}</p>
                </div>
                <span className={cn("text-xs font-semibold tabular-nums",
                  ev.amount > 0 ? "text-emerald-500" : "text-red-500")}>
                  {ev.amount > 0 ? "+" : ""}{formatCurrency(ev.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Runway Analysis */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="dash-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Runway Analysis</h2>
          </div>
          <span className="text-xs text-muted-foreground">Based on current burn rate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Base Case", months: 18, burn: 42000, color: "bg-emerald-500" },
            { label: "Optimistic", months: 24, burn: 35000, color: "bg-blue-500" },
            { label: "Pessimistic", months: 11, burn: 58000, color: "bg-red-500" },
          ].map(scenario => (
            <div key={scenario.label} className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">{scenario.label}</p>
              <p className="text-2xl font-display font-bold">{scenario.months}<span className="text-sm font-normal text-muted-foreground ml-1">months</span></p>
              <p className="text-xs text-muted-foreground mt-1">Burn: {formatCurrency(scenario.burn)}/mo</p>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scenario.months / 24) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className={cn("h-full rounded-full", scenario.color)}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
