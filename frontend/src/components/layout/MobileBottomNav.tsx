"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BarChart2, Sparkles,
  Upload, ListTodo, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

const MOBILE_NAV = [
  { href: "/dashboard",   label: "Home",      icon: LayoutDashboard },
  { href: "/analytics",   label: "Analytics", icon: BarChart2 },
  { href: "/ai-insights", label: "AI",        icon: Sparkles },
  { href: "/tasks",       label: "Tasks",     icon: ListTodo },
  { href: "/upload",      label: "Upload",    icon: Upload },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setChatOpen } = useUIStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn("mobile-nav-item", isActive && "active")}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* AI Chat button */}
        <button className="flex-1" onClick={() => setChatOpen(true)}>
          <div className="mobile-nav-item">
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span>NEXU</span>
          </div>
        </button>
      </div>
    </nav>
  );
}
