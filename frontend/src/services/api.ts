// ============================================================
// NEXU — API Service Layer
// All backend routes are mapped here. No URLs anywhere else.
// Base URL lives in .env.local as NEXT_PUBLIC_API_URL
// ============================================================

import axiosInstance from "@/lib/axios";
import type {
  LoginRequest, RegisterRequest, TokenResponse, User,
  DashboardSummary, MetricSummary, MetricTrend,
  RevenueSummary, ForecastResponse,
  GrowthSummary, Recommendation, Notification,
  NotificationsResponse, Integration, DataUpload,
  TeamMember, TeamInvite, AnalyticsReport,
  HealthScore, Anomaly, CorrelationReport, InsightBenchmark,
} from "@/types";

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) => {
    const form = new URLSearchParams();
    form.append("username", data.username);
    form.append("password", data.password);
    return axiosInstance.post<TokenResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  register: (data: RegisterRequest) =>
    axiosInstance.post<User>("/auth/register", data),
  me: () =>
    axiosInstance.get<User>("/auth/me"),
};

// ── Dashboard ────────────────────────────────────────────
export const dashboardApi = {
  getSummary: (orgId: string) =>
    axiosInstance.get<DashboardSummary>(`/dashboard/${orgId}`),
};

// ── Metrics ──────────────────────────────────────────────
export const metricsApi = {
  getSummary: (orgId: string) =>
    axiosInstance.get<MetricSummary>(`/metrics/${orgId}/summary`),
  getTrend: (orgId: string, metric: string, days = 30) =>
    axiosInstance.get<{ metric: string; period_days: number; data: MetricTrend[] }>(
      `/metrics/${orgId}/trend/${metric}?days=${days}`
    ),
  getLatest: (orgId: string) =>
    axiosInstance.get(`/metrics/${orgId}/latest`),
  createSnapshot: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/metrics/${orgId}/snapshot`, data),
};

// ── Revenue ──────────────────────────────────────────────
export const revenueApi = {
  getSummary: (orgId: string, days = 30) =>
    axiosInstance.get<RevenueSummary>(`/revenue/${orgId}/summary?days=${days}`),
  getForecast: (orgId: string, months = 6) =>
    axiosInstance.get<ForecastResponse>(`/revenue/${orgId}/forecast?months=${months}`),
  getRunway: (orgId: string) =>
    axiosInstance.get(`/revenue/${orgId}/runway`),
  createEvent: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/revenue/${orgId}/events`, data),
};

// ── Growth ───────────────────────────────────────────────
export const growthApi = {
  getSummary: (orgId: string, days = 30) =>
    axiosInstance.get<GrowthSummary>(`/growth/${orgId}/summary?days=${days}`),
  createEvent: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/growth/${orgId}/events`, data),
};

// ── Analytics ────────────────────────────────────────────
export const analyticsApi = {
  listReports: (orgId: string) =>
    axiosInstance.get<AnalyticsReport[]>(`/analytics/${orgId}/reports`),
  createReport: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/analytics/${orgId}/reports`, data),
  generateReport: (orgId: string, reportId: string) =>
    axiosInstance.post(`/analytics/${orgId}/reports/${reportId}/generate`),
  getExecutiveSummary: (orgId: string, days = 30) =>
    axiosInstance.get(`/analytics/${orgId}/executive-summary?days=${days}`),
};

// ── AI Insights ──────────────────────────────────────────
export const insightsApi = {
  getBenchmarks: (orgId: string) =>
    axiosInstance.get<InsightBenchmark>(`/insights/${orgId}/benchmarks`),
  getSingleBenchmark: (orgId: string, metric: string) =>
    axiosInstance.get(`/insights/${orgId}/benchmarks/${metric}`),
  getHealthScore: (orgId: string) =>
    axiosInstance.get<HealthScore>(`/insights/${orgId}/health-score`),
  detectAnomalies: (orgId: string, explain = false) =>
    axiosInstance.get<{ anomalies: Anomaly[]; anomalies_detected: number; critical_count: number; warning_count: number }>(
      `/insights/${orgId}/anomalies/detect?explain=${explain}`
    ),
  getAnomalyHistory: (orgId: string, days = 30) =>
    axiosInstance.get(`/insights/${orgId}/anomalies/history?days=${days}`),
  runScenario: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/insights/${orgId}/whatif/scenario`, data),
  compareScenarios: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/insights/${orgId}/whatif/compare`, data),
  getAcquisitionSegments: (orgId: string) =>
    axiosInstance.get(`/insights/${orgId}/segments/acquisition`),
  getCohorts: (orgId: string, periods = 6) =>
    axiosInstance.get(`/insights/${orgId}/segments/cohorts?periods=${periods}`),
};

// ── Correlations ─────────────────────────────────────────
export const correlationsApi = {
  getReport: (orgId: string) =>
    axiosInstance.get<CorrelationReport>(`/correlations/${orgId}/report`),
  getPlatformSummary: (orgId: string) =>
    axiosInstance.get(`/correlations/${orgId}/platforms`),
  getCampaignLeaderboard: (orgId: string, params?: Record<string, string>) =>
    axiosInstance.get(`/correlations/${orgId}/campaigns/leaderboard`, { params }),
  runWhatIf: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/correlations/${orgId}/whatif`, data),
  getAiNarrative: (orgId: string) =>
    axiosInstance.post(`/correlations/${orgId}/ai-narrative`),
  getRecommendations: (orgId: string) =>
    axiosInstance.get(`/correlations/${orgId}/recommendations`),
};

// ── Recommendations ──────────────────────────────────────
export const recommendationsApi = {
  list: (orgId: string, category?: string) =>
    axiosInstance.get<Recommendation[]>(
      `/recommendations/${orgId}${category ? `?category=${category}` : ""}`
    ),
  generate: (orgId: string) =>
    axiosInstance.post<Recommendation[]>(`/recommendations/${orgId}/generate`),
  update: (orgId: string, recId: string, data: { is_dismissed?: boolean; is_actioned?: boolean }) =>
    axiosInstance.patch(`/recommendations/${orgId}/${recId}`, data),
};

// ── Integrations ─────────────────────────────────────────
export const integrationsApi = {
  list: (orgId: string) =>
    axiosInstance.get<Integration[]>(`/integrations/${orgId}`),
  connect: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/integrations/${orgId}/connect`, data),
  update: (orgId: string, provider: string, data: Record<string, unknown>) =>
    axiosInstance.patch(`/integrations/${orgId}/${provider}`, data),
  disconnect: (orgId: string, provider: string) =>
    axiosInstance.delete(`/integrations/${orgId}/${provider}`),
  sync: (orgId: string, provider: string) =>
    axiosInstance.post(`/integrations/${orgId}/${provider}/sync`),
  syncAll: (orgId: string, force = false) =>
    axiosInstance.post(`/integrations/${orgId}/sync-all?force=${force}`),
  getHealth: (orgId: string) =>
    axiosInstance.get(`/integrations/${orgId}/health/status`),
  validateStripe: (orgId: string, apiKey: string) =>
    axiosInstance.get(`/integrations/${orgId}/validate/stripe?api_key=${apiKey}`),
};

// ── Uploads ──────────────────────────────────────────────
export const uploadsApi = {
  upload: (orgId: string, file: File, uploadTypeHint?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (uploadTypeHint) form.append("upload_type_hint", uploadTypeHint);
    return axiosInstance.post<{ upload_id: string; status: string; poll_url: string }>(
      `/uploads/${orgId}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  list: (orgId: string, params?: { limit?: number; offset?: number; upload_type?: string }) =>
    axiosInstance.get<DataUpload[]>(`/uploads/${orgId}`, { params }),
  get: (orgId: string, uploadId: string) =>
    axiosInstance.get<DataUpload>(`/uploads/${orgId}/${uploadId}`),
  delete: (orgId: string, uploadId: string) =>
    axiosInstance.delete(`/uploads/${orgId}/${uploadId}`),
  reanalyze: (orgId: string, uploadId: string) =>
    axiosInstance.post(`/uploads/${orgId}/${uploadId}/reanalyze`),
  getRows: (orgId: string, uploadId: string, limit = 100) =>
    axiosInstance.get(`/uploads/${orgId}/${uploadId}/rows?limit=${limit}`),
  getCampaigns: (orgId: string, uploadId: string) =>
    axiosInstance.get(`/uploads/${orgId}/${uploadId}/campaigns`),
};

// ── Team ─────────────────────────────────────────────────
export const teamApi = {
  listMembers: (orgId: string) =>
    axiosInstance.get<TeamMember[]>(`/team/${orgId}/members`),
  updateMemberRole: (orgId: string, userId: string, role: string) =>
    axiosInstance.patch(`/team/${orgId}/members/${userId}/role`, { role }),
  removeMember: (orgId: string, userId: string) =>
    axiosInstance.delete(`/team/${orgId}/members/${userId}`),
  sendInvite: (orgId: string, data: { email: string; role: string; message?: string }) =>
    axiosInstance.post(`/team/${orgId}/invite`, data),
  listInvites: (orgId: string) =>
    axiosInstance.get<TeamInvite[]>(`/team/${orgId}/invites`),
  acceptInvite: (token: string) =>
    axiosInstance.post(`/team/invite/accept?token=${token}`),
  revokeInvite: (orgId: string, inviteId: string) =>
    axiosInstance.delete(`/team/${orgId}/invites/${inviteId}`),
};

// ── Notifications ────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { unread_only?: boolean; limit?: number; offset?: number }) =>
    axiosInstance.get<NotificationsResponse>("/notifications/", { params }),
  markRead: (notificationId: string) =>
    axiosInstance.post(`/notifications/${notificationId}/read`),
  markAllRead: () =>
    axiosInstance.post("/notifications/read-all"),
  listAlertRules: (orgId: string) =>
    axiosInstance.get(`/notifications/${orgId}/alerts/rules`),
  createAlertRule: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/notifications/${orgId}/alerts/rules`, data),
  deleteAlertRule: (orgId: string, ruleId: string) =>
    axiosInstance.delete(`/notifications/${orgId}/alerts/rules/${ruleId}`),
  runAnomalyScan: (orgId: string) =>
    axiosInstance.post(`/notifications/${orgId}/anomaly-scan`),
};

// ── Settings ─────────────────────────────────────────────
export const settingsApi = {
  getProfile: () =>
    axiosInstance.get("/settings/me/preferences"),
  updateProfile: (data: Record<string, unknown>) =>
    axiosInstance.patch("/settings/me/preferences", data),
  getOrg: (orgId: string) =>
    axiosInstance.get(`/settings/${orgId}/organization`),
  updateOrg: (orgId: string, data: Record<string, unknown>) =>
    axiosInstance.patch(`/settings/${orgId}/organization`, data),
};

// ── AI Chat (uses OpenAI/Anthropic via backend) ──────────
export const aiChatApi = {
  chat: (orgId: string, message: string, history: { role: string; content: string }[] = []) =>
    axiosInstance.post(`/insights/${orgId}/chat`, { message, history }),
  getQuickInsight: (orgId: string) =>
    axiosInstance.get(`/insights/${orgId}/health-score`),
  generateRecommendation: (orgId: string) =>
    axiosInstance.post(`/recommendations/${orgId}/generate`),
};

// ── Charts ───────────────────────────────────────────────
export const chartsApi = {
  list: (orgId: string) =>
    axiosInstance.get(`/charts/${orgId}/configs`),
};

// ── AI Usage ─────────────────────────────────────────────
export const aiUsageApi = {
  getSummary: (orgId: string, days = 30) =>
    axiosInstance.get(`/ai-usage/${orgId}/summary?days=${days}`),
};

// ── Support ──────────────────────────────────────────────
export const supportApi = {
  createTicket: (data: Record<string, unknown>) =>
    axiosInstance.post("/support/tickets", data),
  listTickets: (status?: string) =>
    axiosInstance.get(`/support/tickets${status ? `?status=${status}` : ""}`),
  getTicket: (ticketId: string) =>
    axiosInstance.get(`/support/tickets/${ticketId}`),
  getFaq: () =>
    axiosInstance.get("/support/faq"),
};

// ── Admin ────────────────────────────────────────────────
export const adminApi = {
  getOverview: () =>
    axiosInstance.get("/admin/overview"),
  listUsers: (params?: Record<string, unknown>) =>
    axiosInstance.get("/admin/users", { params }),
  getAuditLogs: (orgId: string, days = 30) =>
    axiosInstance.get(`/admin/${orgId}/audit-logs?days=${days}`),
  getPerformance: (hours = 24) =>
    axiosInstance.get(`/admin/performance?hours=${hours}`),
};

// ── Health ───────────────────────────────────────────────
export const healthApi = {
  check: () => axiosInstance.get("/health"),
};
