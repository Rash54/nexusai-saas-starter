"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart2, Sparkles, Upload,
  TrendingUp, ListTodo, Activity, GitMerge,
  Users, Building2, Plug, CreditCard, Settings,
  Bell, ChevronLeft, ChevronRight, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexuLogo } from "@/components/ui/NexuLogo";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useNotifications } from "@/hooks/useApi";

// ── Nav structure ─────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
      { href: "/analytics",    label: "Analytics",    icon: BarChart2 },
      { href: "/ai-insights",  label: "AI Insights",  icon: Sparkles, badge: "AI" },
      { href: "/upload",       label: "Upload Data",  icon: Upload },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/revenue",      label: "Revenue",      icon: TrendingUp },
      { href: "/growth",       label: "Growth",       icon: Activity },
      { href: "/metrics",      label: "Metrics",      icon: BarChart2 },
      { href: "/correlations", label: "Correlations", icon: GitMerge },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/tasks",        label: "Tasks",        icon: ListTodo },
      { href: "/team",         label: "Teams",        icon: Users },
      { href: "/organizations",label: "Organizations",icon: Building2 },
      { href: "/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/notifications",label: "Notifications",icon: Bell },
      { href: "/billing",      label: "Billing",      icon: CreditCard },
      { href: "/settings",     label: "Settings",     icon: Settings },
    ],
  },
];

// ── Sidebar component ─────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, setChatOpen } = useUIStore();
  const { user } = useAuthStore();
  const { data: notifs } = useNotifications();
  const unreadCount = notifs?.unread_count ?? 0;

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-hidden relative z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <NexuLogo collapsed={sidebarCollapsed} size="md" />
        <button
          onClick={toggleSidebarCollapsed}
          className="touch-target rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5 transition-all ml-auto flex-shrink-0"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 no-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                      className={cn(
                        "nav-item",
                        isActive && "active",
                        sidebarCollapsed && "justify-center px-0"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "text-sidebar-foreground/60")} />
                        {item.badge === "AI" && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>

                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Unread badge for notifications */}
                      {!sidebarCollapsed && item.href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto text-xs bg-primary text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* NEXU AI Chat Button */}
      <div className="px-2 pb-3 border-t border-sidebar-border pt-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setChatOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl p-3 transition-all",
            "bg-primary/10 border border-primary/20 hover:bg-primary/20",
            sidebarCollapsed && "justify-center"
          )}
        >
          <div className="relative flex-shrink-0">
            <Bot className="w-5 h-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden text-left"
              >
                <p className="text-xs font-semibold text-primary whitespace-nowrap">NEXU AI</p>
                <p className="text-[10px] text-sidebar-foreground/50 whitespace-nowrap">Ask me anything...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* User avatar */}
      <div className={cn(
        "flex items-center gap-3 px-3 py-3 border-t border-sidebar-border",
        sidebarCollapsed && "justify-center"
      )}>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-medium text-sidebar-foreground whitespace-nowrap truncate max-w-[120px]">
                {user?.full_name ?? "User"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 whitespace-nowrap truncate max-w-[120px]">
                {user?.email ?? ""}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
