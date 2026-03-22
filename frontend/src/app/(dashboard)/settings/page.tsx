"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Building2, Bell, Shield, Palette,
  Save, Camera, Eye, EyeOff, Check,
  Trash2, Sun, Moon, Monitor, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import { settingsApi } from "@/services/api";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

const TABS = [
  { id: "profile",    label: "Profile",       icon: User },
  { id: "org",        label: "Organization",  icon: Building2 },
  { id: "notifs",     label: "Notifications", icon: Bell },
  { id: "security",   label: "Security",      icon: Shield },
  { id: "appearance", label: "Appearance",    icon: Palette },
] as const;
type Tab = typeof TABS[number]["id"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const { user, orgId, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    timezone: "UTC",
  });

  const [org, setOrg] = useState({
    name: "",
    slug: "",
    industry: "SaaS",
    size: "1-10",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    anomaly_email: true, anomaly_inapp: true,
    insights_email: false, insights_inapp: true,
    team_email: true, team_inapp: true,
    weekly_digest: true,
  });

  const [passwords, setPasswords] = useState({
    current: "", next: "", confirm: "",
  });

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2 MB");
      return;
    }
    setAvatarUploading(true);
    try {
      // Convert to base64 data URL and store as avatar_url
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await axiosInstance.patch(`/users/${user?.id}`, { avatar_url: dataUrl });
        // Update local user state
        if (user) setUser({ ...user, avatar_url: dataUrl });
        toast.success("Profile picture updated");
        setAvatarUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image");
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload avatar");
      setAvatarUploading(false);
    }
  };

  // ── Save handler — real API calls per tab ────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "profile") {
        // Update full_name and email on the user record
        await axiosInstance.patch(`/users/${user?.id}`, {
          full_name: profile.full_name,
          email: profile.email,
        });
        if (user) setUser({ ...user, full_name: profile.full_name, email: profile.email });
        toast.success("Profile updated");
      }

      if (activeTab === "org" && orgId) {
        await settingsApi.updateOrg(orgId, { name: org.name, industry: org.industry });
        toast.success("Organization updated");
      }

      if (activeTab === "notifs") {
        await settingsApi.updatePreferences({
          email_notifications: notifPrefs.anomaly_email,
          weekly_digest: notifPrefs.weekly_digest,
        });
        toast.success("Notification preferences saved");
      }

      if (activeTab === "security") {
        if (!passwords.current) { toast.error("Enter your current password"); setSaving(false); return; }
        if (passwords.next.length < 8) { toast.error("New password must be at least 8 characters"); setSaving(false); return; }
        if (passwords.next !== passwords.confirm) { toast.error("Passwords do not match"); setSaving(false); return; }
        await axiosInstance.patch(`/users/${user?.id}`, { password: passwords.next });
        setPasswords({ current: "", next: "", confirm: "" });
        toast.success("Password updated");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to save — check your connection");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast("Click again to permanently delete your account", { icon: "⚠️" });
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    setDeleting(true);
    try {
      await axiosInstance.delete(`/users/${user?.id}`);
      toast.success("Account deleted");
      logout();
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 flex-wrap lg:flex-nowrap">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="dash-card space-y-6"
          >
            {/* ── Profile ── */}
            {activeTab === "profile" && (
              <>
                <Section title="Personal Info">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Avatar"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-bold text-primary">
                          {initials}
                        </div>
                      )}
                      <button
                        onClick={() => avatarRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
                      >
                        {avatarUploading
                          ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                          : <Camera className="w-3 h-3 text-white" />}
                      </button>
                      <input
                        ref={avatarRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile.full_name || "Your Name"}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click the camera icon to upload a photo (max 2 MB)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name">
                      <input
                        value={profile.full_name}
                        onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        className="input-base h-10"
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                        className="input-base h-10"
                      />
                    </Field>
                    <Field label="Timezone">
                      <select
                        value={profile.timezone}
                        onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                        className="input-base h-10"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern (ET)</option>
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Africa/Nairobi">Nairobi (EAT)</option>
                        <option value="Africa/Kampala">Kampala (EAT)</option>
                      </select>
                    </Field>
                  </div>
                </Section>

                <div className="border-t border-border pt-4">
                  <Section title="Danger Zone">
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Delete Account</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Permanently deletes your account and all associated data. This cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex items-center gap-1.5 btn-secondary h-8 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deleting
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                        {confirmDelete ? "Click again to confirm" : "Delete my account"}
                      </button>
                    </div>
                  </Section>
                </div>
              </>
            )}

            {/* ── Organization ── */}
            {activeTab === "org" && (
              <Section title="Organization Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Organization Name">
                    <input
                      value={org.name}
                      onChange={e => setOrg(o => ({ ...o, name: e.target.value }))}
                      className="input-base h-10"
                      placeholder="Your organization name"
                    />
                  </Field>
                  <Field label="Slug" hint="Used in URLs — lowercase, no spaces">
                    <input
                      value={org.slug}
                      onChange={e => setOrg(o => ({ ...o, slug: e.target.value }))}
                      className="input-base h-10"
                    />
                  </Field>
                  <Field label="Industry">
                    <select
                      value={org.industry}
                      onChange={e => setOrg(o => ({ ...o, industry: e.target.value }))}
                      className="input-base h-10"
                    >
                      {["SaaS", "E-commerce", "Fintech", "Healthcare", "Media", "Other"].map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Team Size">
                    <select
                      value={org.size}
                      onChange={e => setOrg(o => ({ ...o, size: e.target.value }))}
                      className="input-base h-10"
                    >
                      {["1-10", "11-50", "51-200", "200+"].map(s => (
                        <option key={s} value={s}>{s} employees</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifs" && (
              <Section title="Notification Preferences">
                <div className="space-y-4">
                  {[
                    { key: "anomaly",  label: "Anomaly Alerts",  desc: "MRR drops, churn spikes, runway warnings" },
                    { key: "insights", label: "AI Insights",     desc: "New insights generated from your data" },
                    { key: "team",     label: "Team Activity",   desc: "New members, role changes, invites" },
                  ].map(group => (
                    <div key={group.key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium">{group.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {["email", "inapp"].map(channel => {
                          const key = `${group.key}_${channel}` as keyof typeof notifPrefs;
                          const val = notifPrefs[key];
                          return (
                            <div key={channel} className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {channel === "inapp" ? "In-app" : "Email"}
                              </span>
                              <button
                                onClick={() => setNotifPrefs(p => ({ ...p, [key]: !val }))}
                                className={cn(
                                  "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                                  val ? "bg-primary justify-end" : "bg-muted justify-start"
                                )}
                              >
                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium">Weekly Digest</p>
                      <p className="text-xs text-muted-foreground">Summary of key metrics every Monday</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(p => ({ ...p, weekly_digest: !p.weekly_digest }))}
                      className={cn(
                        "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                        notifPrefs.weekly_digest ? "bg-primary justify-end" : "bg-muted justify-start"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </Section>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <Section title="Change Password">
                <div className="space-y-4">
                  <Field label="Current Password">
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                        placeholder="••••••••"
                        className="input-base h-10 pr-10"
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password" hint="Minimum 8 characters">
                    <input
                      type="password"
                      value={passwords.next}
                      onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                      placeholder="Minimum 8 characters"
                      className="input-base h-10"
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat new password"
                      className="input-base h-10"
                    />
                  </Field>
                </div>
              </Section>
            )}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <Section title="Theme">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light",  label: "Light",  icon: Sun },
                    { value: "dark",   label: "Dark",   icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        theme === t.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-accent/30"
                      )}
                    >
                      <t.icon className={cn("w-5 h-5", theme === t.value ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Save button — all tabs except appearance */}
            {activeTab !== "appearance" && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary h-10 gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : saved
                    ? <Check className="w-4 h-4" />
                    : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
