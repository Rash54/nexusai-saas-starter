"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BarChart2, Sparkles, Upload,
  TrendingUp, Activity, GitMerge, Users,
  Building2, Plug, CreditCard, Settings,
  X, LogOut, ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexuLogo } from "@/components/ui/NexuLogo";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const ALL_NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/analytics",    label: "Analytics",    icon: BarChart2 },
  { href: "/ai-insights",  label: "AI Insights",  icon: Sparkles },
  { href: "/upload",       label: "Upload Data",  icon: Upload },
  { href: "/revenue",      label: "Revenue",      icon: TrendingUp },
  { href: "/growth",       label: "Growth",       icon: Activity },
  { href: "/correlations", label: "Correlations", icon: GitMerge },
  { href: "/tasks",        label: "Tasks",        icon: ListTodo },
  { href: "/team",         label: "Team",         icon: Users },
  { href: "/organizations",label: "Organizations",icon: Building2 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/billing",      label: "Billing",      icon: CreditCard },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
    setSidebarOpen(false);
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-sidebar border-r border-sidebar-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border flex-shrink-0">
              <NexuLogo size="md" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="touch-target rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
              {ALL_NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={cn("nav-item", isActive && "active")}>
                      <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "text-sidebar-foreground/60")} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* User */}
            <div className="px-3 pb-6 pt-3 border-t border-sidebar-border space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                  {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name}</p>
                  <p className="text-xs text-sidebar-foreground/40 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
