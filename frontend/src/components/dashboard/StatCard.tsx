"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  format?: "currency" | "number" | "percent" | "raw";
  sparkData?: { value: number }[];
  sparkColor?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  delay?: number;
  highlighted?: boolean;
  colorVariant?: "blue" | "green" | "purple" | "amber" | "cyan" | "rose";
}

const VARIANT_STYLES: Record<string, { card: string; icon: string; spark: string; glow: string }> = {
  blue: {
    card: "stat-card-blue",
    icon: "bg-blue-500/15 text-blue-500",
    spark: "hsl(234 89% 62%)",
    glow: "0 0 20px hsl(234 89% 62% / 0.15)",
  },
  green: {
    card: "stat-card-green",
    icon: "bg-emerald-500/15 text-emerald-500",
    spark: "hsl(162 73% 46%)",
    glow: "0 0 20px hsl(162 73% 46% / 0.15)",
  },
  purple: {
    card: "stat-card-purple",
    icon: "bg-purple-500/15 text-purple-500",
    spark: "hsl(280 68% 62%)",
    glow: "0 0 20px hsl(280 68% 62% / 0.15)",
  },
  amber: {
    card: "stat-card-amber",
    icon: "bg-amber-500/15 text-amber-500",
    spark: "hsl(38 92% 50%)",
    glow: "0 0 20px hsl(38 92% 50% / 0.15)",
  },
  cyan: {
    card: "stat-card-cyan",
    icon: "bg-cyan-500/15 text-cyan-500",
    spark: "hsl(199 89% 50%)",
    glow: "0 0 20px hsl(199 89% 50% / 0.15)",
  },
  rose: {
    card: "stat-card-rose",
    icon: "bg-rose-500/15 text-rose-500",
    spark: "hsl(349 89% 62%)",
    glow: "0 0 20px hsl(349 89% 62% / 0.15)",
  },
};

export function StatCard({
  title, value, change, changeLabel, format = "raw",
  sparkData, sparkColor,
  icon, iconBg, delay = 0, highlighted = false,
  colorVariant,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const variant = colorVariant ? VARIANT_STYLES[colorVariant] : null;
  const resolvedSparkColor = sparkColor ?? variant?.spark ?? "hsl(var(--primary))";

  const displayValue = (() => {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(n)) return String(value);
    switch (format) {
      case "currency": return formatCurrency(n);
      case "number":   return formatNumber(n);
      case "percent":  return `${n.toFixed(1)}%`;
      default:         return String(value);
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "dash-card relative overflow-hidden card-hover",
        variant?.card,
        highlighted && "border-primary/30 bg-primary/5"
      )}
      style={variant ? { boxShadow: variant.glow } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="stat-value mt-1 truncate">{displayValue}</p>
        </div>
        {icon && (
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-2",
            iconBg ?? variant?.icon ?? "bg-primary/10"
          )}>
            {icon}
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            isPositive ? "text-emerald-500" : "text-red-500"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(Math.abs(change))}
          </div>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-14 opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={resolvedSparkColor} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={resolvedSparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={resolvedSparkColor}
                strokeWidth={2}
                fill={`url(#grad-${title.replace(/\s/g, "")})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
