"use client";

import { motion } from "framer-motion";
import { Lock, Zap, ArrowRight } from "lucide-react";

interface ProGateProps {
  feature: string;
  description: string;
  bullets?: string[];
}

export function ProGate({ feature, description, bullets = [] }: ProGateProps) {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Blurred background preview */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none select-none"
        style={{ filter: "blur(6px)" }}
        aria-hidden
      >
        <div className="p-8 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-current opacity-10"
              style={{ width: `${60 + (i % 3) * 15}%` }}
            />
          ))}
        </div>
      </div>

      {/* Gate card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-md w-full mx-auto p-8 rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-sm shadow-lg text-center"
      >
        {/* Lock icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <h2 className="text-xl font-display font-bold mb-2">{feature}</h2>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>

        {bullets.length > 0 && (
          <ul className="text-left space-y-2 mb-6">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        <a
          href="https://yusuf545.gumroad.com/l/ttazrg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
          <ArrowRight className="w-4 h-4" />
        </a>

        <p className="text-xs text-muted-foreground mt-4">
          One-time purchase · Full source code · Lifetime updates
        </p>
      </motion.div>
    </div>
  );
}
