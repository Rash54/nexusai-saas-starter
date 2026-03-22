"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Sun, Moon, ChevronDown, LogOut,
  Settings, User as UserIcon, Menu, Zap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/useApi";
import { useTheme } from "next-themes";
import { timeAgo } from "@/lib/utils";
import { NexuLogo } from "@/components/ui/NexuLogo";

export function Topbar() {
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { data: notifs } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifs?.unread_count ?? 0;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex-shrink-0">

      {/* Mobile: logo + hamburger */}
      <div className="flex md:hidden items-center gap-3 flex-1">
        <button onClick={toggleSidebar} className="touch-target text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <NexuLogo size="sm" />
      </div>

      {/* Desktop: Search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className={cn(
          "relative w-full transition-all duration-200",
          searchOpen ? "max-w-full" : "max-w-xs"
        )}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search metrics, insights, data..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            className="input-base pl-9 h-9 text-sm bg-muted/50 border-transparent focus:bg-background"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-0">

        {/* AI Credits indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">78%</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="touch-target rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="touch-target rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead.mutate()}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifs?.notifications?.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifs?.notifications?.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors",
                            !n.is_read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                              n.level === "critical" ? "bg-red-500" :
                              n.level === "warning" ? "bg-amber-500" :
                              n.level === "success" ? "bg-emerald-500" : "bg-blue-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      onClick={() => { router.push("/notifications"); setNotifOpen(false); }}
                      className="text-xs text-primary hover:underline w-full text-center"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-accent transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden md:block text-sm font-medium max-w-[80px] truncate">
              {user?.full_name?.split(" ")[0] ?? "User"}
            </span>
            <ChevronDown className="hidden md:block w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden py-1"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>

                  {[
                    { icon: UserIcon, label: "Profile", href: "/settings" },
                    { icon: Settings, label: "Settings", href: "/settings" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { router.push(item.href); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-border mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
