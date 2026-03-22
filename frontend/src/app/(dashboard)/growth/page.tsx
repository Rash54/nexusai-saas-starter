"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Users, Target, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { useGrowthSummary } from "@/hooks/useApi";

const signupsData = [
  { week: "W1 Feb", signups: 210, activated: 168 },
  { week: "W2 Feb", signups: 245, activated: 191 },
  { week: "W3 Feb", signups: 198, activated: 154 },
  { week: "W4 Feb", signups: 312, activated: 252 },
  { week: "W1 Mar", signups: 287, activated: 236 },
  { week: "W2 Mar", signups: 334, activated: 281 },
  { week: "W3 Mar", signups: 298, activated: 253 },
];

const channelData = [
  { channel: "Organic", signups: 890, color: "hsl(var(--chart-1))" },
  { channel: "Paid Search", signups: 640, color: "hsl(var(--chart-2))" },
  { channel: "Social", signups: 520, color: "hsl(var(--chart-3))" },
  { channel: "Referral", signups: 410, color: "hsl(var(--chart-4))" },
  { channel: "Email", signups: 290, color: "hsl(var(--chart-5))" },
  { channel: "Direct", signups: 180, color: "hsl(280 65% 60%)" },
];

const retentionData = [
  { day: "Day 1", rate: 78 }, { day: "Day 3", rate: 62 },
  { day: "Day 7", rate: 51 }, { day: "Day 14", rate: 44 },
  { day: "Day 30", rate: 38 }, { day: "Day 60", rate: 32 },
  { day: "Day 90", rate: 28 },
];

const PERIODS = ["7D", "30D", "90D"] as const;

function MetricCard({ title, value, sub, change, icon: Icon, color, delay }: {
  title: string; value: string; sub?: string; change?: number;
  icon: React.FC<{ className?: string }>; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="dash-card"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      {change !== undefined && (
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium",
          change >= 0 ? "text-emerald-500" : "text-red-500")}>
          <ArrowUpRight className="w-3 h-3" />
          {formatPercent(Math.abs(change))} vs last period
        </div>
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
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrowthPage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>("30D");
  const { data: growth } = useGrowthSummary(30);

  const totalSignups = signupsData.reduce((s, d) => s + d.signups, 0);
  const totalActivated = signupsData.reduce((s, d) => s + d.activated, 0);
  const activationRate = Math.round((totalActivated / totalSignups) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Growth</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Signups, activation, retention & channel performance</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Signups" value={formatNumber(growth?.total_signups ?? 1884)} sub="This period" change={14.2} icon={Users} color="bg-primary/10 text-primary" delay={0} />
        <MetricCard title="Activation Rate" value={`${growth?.activation_rate ?? activationRate}%`} sub="Signed up → activated" change={3.1} icon={Target} color="bg-emerald-500/10 text-emerald-500" delay={0.05} />
        <MetricCard title="Trial → Paid" value={`${growth?.trial_to_paid_rate ?? 38}%`} sub="Conversion rate" change={1.8} icon={TrendingUp} color="bg-blue-500/10 text-blue-500" delay={0.1} />
        <MetricCard title="D30 Retention" value="38%" sub="Day-30 active users" change={-2.1} icon={Activity} color="bg-amber-500/10 text-amber-500" delay={0.15} />
      </div>

      {/* Signups chart + Channel breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Signups vs Activations</h2>
              <p className="text-xs text-muted-foreground">Weekly breakdown</p>
            </div>
            <span className="badge-success">{activationRate}% activation</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupsData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={3} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="signups" name="Signups" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.7} />
                <Bar dataKey="activated" name="Activated" fill="hsl(142 71% 45%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Channel breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="dash-card">
          <h2 className="text-sm font-semibold mb-4">Acquisition Channels</h2>
          <div className="space-y-3">
            {channelData.map((c, i) => {
              const pct = Math.round((c.signups / channelData[0].signups) * 100);
              return (
                <div key={c.channel}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-muted-foreground">{c.channel}</span>
                    </div>
                    <span className="font-semibold">{formatNumber(c.signups)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Retention curve */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">User Retention Curve</h2>
            <p className="text-xs text-muted-foreground">% of users still active after N days</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-display font-bold">28%</p>
            <p className="text-xs text-muted-foreground">Day-90 retention</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={retentionData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Retention"]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }} />
              <Area type="monotone" dataKey="rate" name="Retention" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#retGrad)" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
