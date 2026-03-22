"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, TrendingUp, Download, Plus,
  Calendar, Filter, RefreshCw, FileText,
  PieChart, Activity, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { useExecutiveSummary, useRevenueSummary, useGrowthSummary, useMetricTrend } from "@/hooks/useApi";

// ── Mock data ─────────────────────────────────────────────
const revenueMonthly = [
  { month: "Oct", mrr: 18200, new: 3200, churn: 800 },
  { month: "Nov", mrr: 19800, new: 2900, churn: 1300 },
  { month: "Dec", mrr: 21100, new: 3500, churn: 1200 },
  { month: "Jan", mrr: 22400, new: 4100, churn: 800 },
  { month: "Feb", mrr: 23800, new: 3800, churn: 1400 },
  { month: "Mar", mrr: 24300, new: 2100, churn: 1600 },
];

const channelData = [
  { name: "Organic", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Paid", value: 28, color: "hsl(var(--chart-2))" },
  { name: "Referral", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Direct", value: 17, color: "hsl(var(--chart-4))" },
];

const funnelData = [
  { stage: "Visitors", count: 12400 },
  { stage: "Signups", count: 3100 },
  { stage: "Activated", count: 1860 },
  { stage: "Paid", count: 744 },
  { stage: "Retained", count: 521 },
];

const cohortData = [
  { month: "Jan", m0: 100, m1: 82, m2: 71, m3: 65 },
  { month: "Feb", m0: 100, m1: 79, m2: 68, m3: 60 },
  { month: "Mar", m0: 100, m1: 85, m2: 74 },
  { month: "Apr", m0: 100, m1: 88 },
];

const PERIOD_OPTIONS = ["7D", "30D", "90D", "1Y"] as const;
type Period = typeof PERIOD_OPTIONS[number];

const REPORT_TYPES = [
  "MRR Breakdown", "Growth Cohort", "AI Cost Analysis",
  "Revenue Forecast", "Churn Analysis", "Executive Summary",
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">{typeof p.value === "number" && p.value > 1000 ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30D");
  const [showNewReport, setShowNewReport] = useState(false);

  const { data: execSummary } = useExecutiveSummary(30);

  const kpis = [
    { label: "Total MRR", value: formatCurrency(execSummary?.financial?.mrr ?? 24300), change: "+12.4%" },
    { label: "Active Customers", value: formatNumber(execSummary?.customers?.total ?? 1284), change: "+8.2%" },
    { label: "Churn Rate", value: `${execSummary?.customers?.churn_rate ?? 3.2}%`, change: "-0.4%", negative: true },
    { label: "NRR", value: `${execSummary?.customers?.nrr ?? 108}%`, change: "+2%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep-dive into your business metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="btn-secondary h-9 text-sm gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowNewReport(true)}
            className="btn-primary h-9 text-sm gap-1.5"
          >
            <Plus className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="dash-card"
          >
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-display font-bold tabular-nums">{kpi.value}</p>
            <p className={cn("text-xs font-medium mt-1", kpi.negative ? "text-emerald-500" : "text-emerald-500")}>
              {kpi.change}
            </p>
          </motion.div>
        ))}
      </div>

      {/* MRR chart + Channel breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">MRR Breakdown</h2>
              <p className="text-xs text-muted-foreground">New, Expansion, Churn</p>
            </div>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="new" name="New MRR" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="churn" name="Churned MRR" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} stackId="b" opacity={0.7} />
                <Bar dataKey="mrr" name="Net MRR" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Acquisition channels pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Acquisition Channels</h2>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie
                  data={channelData}
                  cx="50%" cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {channelData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, ""]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {channelData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-semibold">{c.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Funnel + Cohort */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Conversion Funnel</h2>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2.5">
            {funnelData.map((stage, i) => {
              const pct = Math.round((stage.count / funnelData[0].count) * 100);
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatNumber(stage.count)}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: `hsl(${232 - i * 15} 89% ${65 - i * 4}%)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Cohort retention */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="dash-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Cohort Retention</h2>
            <button className="text-xs text-primary hover:underline">View full</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-muted-foreground font-medium">Cohort</th>
                  {["M0", "M1", "M2", "M3"].map(m => (
                    <th key={m} className="pb-2 text-muted-foreground font-medium text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1">
                {cohortData.map(row => (
                  <tr key={row.month}>
                    <td className="py-1.5 text-muted-foreground pr-3">{row.month}</td>
                    {[row.m0, row.m1, row.m2, row.m3].map((val, i) => (
                      <td key={i} className="py-1.5 text-center">
                        {val !== undefined ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded font-medium"
                            style={{
                              background: `hsl(var(--primary) / ${val / 100 * 0.3})`,
                              color: val >= 80 ? "hsl(var(--primary))" : val >= 60 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {val}%
                          </span>
                        ) : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Reports section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="dash-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Scheduled Reports</h2>
          </div>
          <button
            onClick={() => setShowNewReport(true)}
            className="btn-primary h-8 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {REPORT_TYPES.map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{type}</p>
                <p className="text-[10px] text-muted-foreground">Monthly • PDF</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
