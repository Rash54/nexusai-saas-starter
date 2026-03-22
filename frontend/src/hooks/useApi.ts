// ============================================================
// NEXU — React Query Hooks (Community Edition)
// Pro hooks are disabled — they return empty data without
// hitting the backend, eliminating 404 noise in the logs.
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardApi, metricsApi, revenueApi, growthApi,
  analyticsApi, uploadsApi, teamApi,
  notificationsApi, authApi,
} from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

// ── Helper ────────────────────────────────────────────────
const useOrgId = () => useAuthStore((s) => s.orgId) ?? "";

function requireOrg(orgId: string, fn: () => Promise<unknown>) {
  if (!orgId) return Promise.reject(new Error("No organisation selected"));
  return fn();
}

// ── Auth ──────────────────────────────────────────────────
export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Dashboard ────────────────────────────────────────────
export function useDashboard() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["dashboard", orgId],
    queryFn: () => dashboardApi.getSummary(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ── Metrics ──────────────────────────────────────────────
export function useMetricSummary() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["metrics", "summary", orgId],
    queryFn: () => metricsApi.getSummary(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMetricTrend(metric: string, days = 30) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["metrics", "trend", orgId, metric, days],
    queryFn: () => metricsApi.getTrend(orgId, metric, days).then((r) => r.data),
    enabled: !!orgId && !!metric,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Revenue ──────────────────────────────────────────────
export function useRevenueSummary(days = 30) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["revenue", "summary", orgId, days],
    queryFn: () => revenueApi.getSummary(orgId, days).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueForecast(months = 6) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["revenue", "forecast", orgId, months],
    queryFn: () => revenueApi.getForecast(orgId, months).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Growth ───────────────────────────────────────────────
export function useGrowthSummary(days = 30) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["growth", "summary", orgId, days],
    queryFn: () => growthApi.getSummary(orgId, days).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Analytics ────────────────────────────────────────────
export function useAnalyticsReports() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["analytics", "reports", orgId],
    queryFn: () => analyticsApi.listReports(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useExecutiveSummary(days = 30) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["analytics", "executive", orgId, days],
    queryFn: () => analyticsApi.getExecutiveSummary(orgId, days).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Insights — Pro Edition (disabled, return empty stubs) ─
// enabled:false means these never hit the backend
export function useHealthScore() {
  return useQuery({
    queryKey: ["insights", "health", "pro-disabled"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: ["insights", "benchmarks", "pro-disabled"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
}

export function useAnomalies(_explain = false) {
  return useQuery({
    queryKey: ["insights", "anomalies", "pro-disabled"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
}

// ── Recommendations — hits community stub endpoint ────────
export function useRecommendations(_category?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["recommendations", orgId],
    queryFn: async () => {
      const { default: axiosInstance } = await import("@/lib/axios");
      const res = await axiosInstance.get(`/recommendations`);
      return res.data;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenerateRecommendations() {
  return useMutation({
    mutationFn: () => Promise.resolve(null),
    onSuccess: () => {
      toast("Upgrade to Pro to generate AI recommendations.", { icon: "🔒" });
    },
  });
}

export function useDismissRecommendation() {
  return useMutation({
    mutationFn: (_recId: string) => Promise.resolve(null),
  });
}

// ── Integrations — Pro Edition (disabled) ────────────────
export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations", "pro-disabled"],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}

export function useConnectIntegration() {
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve(null),
    onSuccess: () => {
      toast("Upgrade to Pro to connect integrations.", { icon: "🔒" });
    },
  });
}

export function useDisconnectIntegration() {
  return useMutation({
    mutationFn: (_provider: string) => Promise.resolve(null),
  });
}

export function useSyncIntegration() {
  return useMutation({
    mutationFn: (_provider: string) => Promise.resolve(null),
  });
}

// ── Uploads ──────────────────────────────────────────────
export function useUploads() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["uploads", orgId],
    queryFn: () => uploadsApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useUploadFile() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, hint }: { file: File; hint?: string }) =>
      requireOrg(orgId, () => uploadsApi.upload(orgId, file, hint).then((r) => r.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads", orgId] });
      toast.success("File uploaded! Processing in background...");
    },
    onError: (err: Error) => {
      if (err.message !== "No organisation selected")
        toast.error("Upload failed");
    },
  });
}

// ── Team ─────────────────────────────────────────────────
export function useTeamMembers() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["team", "members", orgId],
    queryFn: () => teamApi.listMembers(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useTeamInvites() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["team", "invites", orgId],
    queryFn: () => teamApi.listInvites(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useSendInvite() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string; message?: string }) =>
      requireOrg(orgId, () => teamApi.sendInvite(orgId, data).then((r) => r.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invites", orgId] });
      toast.success("Invite sent!");
    },
    onError: (err: Error) => {
      if (err.message !== "No organisation selected")
        toast.error("Failed to send invite");
    },
  });
}

// ── Notifications ────────────────────────────────────────
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () =>
      notificationsApi.list({ unread_only: unreadOnly, limit: 20 }).then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}