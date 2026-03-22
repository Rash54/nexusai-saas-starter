"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NexuLogo({ collapsed = false, className, size = "md" }: LogoProps) {
  const sizes = { sm: 24, md: 32, lg: 40 };
  const px = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Icon */}
      <div
        className="relative flex-shrink-0"
        style={{ width: px, height: px }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="nexu-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f63f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Hexagon background */}
          <path
            d="M20 2L36.5 11V29L20 38L3.5 29V11L20 2Z"
            fill="url(#nexu-grad)"
          />
          {/* N letter mark */}
          <path
            d="M13 28V12L27 28V12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-40"
          style={{
            background: "linear-gradient(135deg, #4f63f7, #7c3aed)",
            zIndex: -1,
          }}
        />
      </div>

      {/* Wordmark */}
      {!collapsed && (
        <span
          className="font-display font-bold tracking-tight text-foreground"
          style={{ fontSize: size === "sm" ? 18 : size === "md" ? 22 : 26 }}
        >
          NEXU{" "}
          <span className="text-primary font-display">AI</span>
        </span>
      )}
    </div>
  );
}
