"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useMetricSummary, useMetricTrend } from "@/hooks/useApi";

const METRIC_CARDS = [
  { key: "mrr",                 label: "MRR",              format: "currency", color: "hsl(var(--chart-1))" },
  { key: "arr",                 label: "ARR",              format: "currency", color: "hsl(var(--chart-2))" },
  { key: "total_customers",     label: "Total Customers",  format: "number",   color: "hsl(var(--chart-3))" },
  { key: "churn_rate",          label: "Churn Rate",       format: "percent",  color: "hsl(0 84% 60%)" },
  { key: "net_revenue_retention",label:"NRR",             format: "percent",  color: "hsl(var(--chart-2))" },
  { key: "arpu",                label: "ARPU",             format: "currency", color: "hsl(var(--chart-4))" },
  { key: "ltv",                 label: "LTV",              format: "currency", color: "hsl(280 65% 60%)" },
  { key: "ltv_cac_ratio",       label: "LTV:CAC",          format: "raw",      color: "hsl(var(--chart-1))" },
  { key: "runway_months",       label: "Runway",           format: "raw",      color: "hsl(38 92% 50%)" },
];

// Mock snapshot values
const MOCK_VALUES: Record<string, number> = {
  mrr: 24300, arr: 291600, total_customers: 1284, churn_rate: 3.2,
  net_revenue_retention: 108, arpu: 189, ltv: 2268, ltv_cac_ratio: 4.8, runway_months: 18,
};

// Mock sparkline data
const genTrend = (base: number, n = 10) =>
  Array.from({ length: n }, (_, i) => ({
    i,
    value: base * (0.85 + (i / n) * 0.2 + (Math.random() - 0.5) * 0.08),
  }));

function formatVal(val: number, fmt: string) {
  if (fmt === "currency") return formatCurrency(val);
  if (fmt === "number") return formatNumber(val);
  if (fmt === "percent") return `${val.toFixed(1)}%`;
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

function MetricCard({ metric, value, trend, delay }: {
  metric: typeof METRIC_CARDS[number];
  value: number;
  trend: { i: number; value: number }[];
  delay: number;
}) {
  const isDown = metric.key === "churn_rate";
  const change = 5.2 * (isDown ? -1 : 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="dash-card relative overflow-hidden card-hover"
    >
      <div className="relative z-10">
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <p className="text-xl font-display font-bold mt-1 tabular-nums">{formatVal(value, metric.format)}</p>
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium",
          change >= 0 ? "text-emerald-500" : "text-red-500")}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(Math.abs(change))} MoM
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function MetricsPage() {
  const { data: summary } = useMetricSummary();

  const values: Record<string, number> = {
    mrr:                  summary?.mrr                  ?? MOCK_VALUES.mrr,
    arr:                  summary?.arr                  ?? MOCK_VALUES.arr,
    total_customers:      summary?.total_customers      ?? MOCK_VALUES.total_customers,
    churn_rate:           summary?.churn_rate           ?? MOCK_VALUES.churn_rate,
    net_revenue_retention:summary?.net_revenue_retention?? MOCK_VALUES.net_revenue_retention,
    arpu:                 summary?.arpu                 ?? MOCK_VALUES.arpu,
    ltv:                  summary?.ltv                  ?? MOCK_VALUES.ltv,
    ltv_cac_ratio:        summary?.ltv_cac_ratio        ?? MOCK_VALUES.ltv_cac_ratio,
    runway_months:        summary?.runway_months        ?? MOCK_VALUES.runway_months,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Metrics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All your SaaS KPIs in one place</p>
        </div>
        <button className="btn-secondary h-9 text-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
        {METRIC_CARDS.map((m, i) => (
          <MetricCard
            key={m.key}
            metric={m}
            value={values[m.key] ?? 0}
            trend={genTrend(values[m.key] ?? 100)}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
