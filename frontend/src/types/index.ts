// ============================================================
// NEXU — TypeScript Types (mirrors backend Pydantic schemas)
// ============================================================

// ── Auth ──────────────────────────────────────────────────
export interface LoginRequest {
  username: string; // FastAPI OAuth2PasswordRequestForm uses "username"
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  is_superuser: boolean;
  last_login_at?: string;
  created_at: string;
}

// ── Organisation ─────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  logo_url?: string;
  created_at: string;
}

// ── Dashboard ────────────────────────────────────────────
export interface DashboardSummary {
  organization_id: string;
  organization_name: string;
  as_of: string;
  mrr: number;
  mrr_growth_pct: number;
  arr: number;
  total_customers: number;
  active_customers: number;
  churn_rate: number;
  net_revenue_retention: number;
  ltv_cac_ratio: number;
  runway_months: number;
  burn_rate: number;
  ai_total_cost_mtd: number;
  ai_total_tokens_mtd: number;
  ai_requests_mtd: number;
  signups_mtd: number;
  activation_rate: number;
  trial_to_paid_rate: number;
  top_recommendations: Recommendation[];
  alerts: Alert[];
}

// ── Metrics ──────────────────────────────────────────────
export interface MetricSummary {
  mrr: number;
  arr: number;
  new_mrr: number;
  churned_mrr: number;
  net_new_mrr: number;
  total_customers: number;
  churn_rate: number;
  net_revenue_retention: number;
  arpu: number;
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
  burn_rate: number;
  runway_months: number;
  cash_balance: number;
  mrr_growth_rate: number;
  customer_growth_rate: number;
  mrr_delta_pct: number;
  customer_delta: number;
}

export interface MetricTrend {
  date: string;
  value: number;
}

// ── Revenue ──────────────────────────────────────────────
export interface RevenueSummary {
  net_new_mrr: number;
  new_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  churned_mrr: number;
  starting_mrr: number;
  ending_mrr: number;
  waterfall: WaterfallItem[];
  events: RevenueEvent[];
}

export interface WaterfallItem {
  label: string;
  value: number;
  type: "positive" | "negative" | "neutral";
}

export interface RevenueEvent {
  id: string;
  type: string;
  amount: number;
  customer_name?: string;
  occurred_at: string;
}

export interface ForecastResponse {
  months: ForecastMonth[];
  summary: Record<string, number>;
}

export interface ForecastMonth {
  month: number;
  projected_mrr: number;
  lower_bound: number;
  upper_bound: number;
}

// ── Growth ───────────────────────────────────────────────
export interface GrowthSummary {
  total_signups: number;
  activation_rate: number;
  trial_to_paid_rate: number;
  channel_breakdown: Record<string, number>;
  cohort_data: CohortData[];
}

export interface CohortData {
  cohort: string;
  [key: string]: string | number | null;
}

// ── Recommendations ──────────────────────────────────────
export interface Recommendation {
  id: string;
  organization_id: string;
  category: string;
  title: string;
  summary: string;
  detail?: string;
  action_items?: string[];
  impact_score: number;
  urgency_score: number;
  confidence: number;
  is_dismissed: boolean;
  is_actioned: boolean;
  created_at: string;
}

// ── Alerts ───────────────────────────────────────────────
export interface Alert {
  level: "critical" | "warning" | "info";
  message: string;
  metric: string;
}

// ── Notifications ────────────────────────────────────────
export interface Notification {
  id: string;
  type: string;
  level: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: Notification[];
}

// ── Integrations ─────────────────────────────────────────
export interface Integration {
  provider: string;
  name: string;
  category: string;
  description: string;
  auth_type: string;
  docs_url: string;
  read_only: boolean;
  is_connected: boolean;
  status: "active" | "error" | "disconnected" | "syncing";
  display_name?: string;
  auto_sync: boolean;
  is_enabled: boolean;
  last_synced_at?: string;
  last_error?: string;
  integration_id?: string;
  sync_interval_minutes: string;
}

// ── Uploads ──────────────────────────────────────────────
export interface DataUpload {
  id: string;
  filename: string;
  original_name: string;
  file_size_bytes: number;
  status: "pending" | "parsing" | "analyzing" | "complete" | "error" | "failed";
  upload_type: string;
  detected_columns?: string[];
  row_count?: number;
  ai_insight_json?: string;
  ai_insight_deep?: string;
  ai_model_quick?: string;
  ai_model_deep?: string;
  ai_tokens_used?: number;
  ai_cost_usd?: number;
  error_message?: string;
  created_at: string;
}

// ── Team ─────────────────────────────────────────────────
export interface TeamMember {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
  last_login_at?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

// ── AI Insights ──────────────────────────────────────────
export interface InsightBenchmark {
  overall_percentile: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  metrics: Record<string, BenchmarkMetric>;
  arr_band?: string;
}

export interface BenchmarkMetric {
  value: number;
  percentile: number;
  grade: string;
  label: string;
  higher_is_better: boolean;
}

export interface HealthScore {
  total_score: number;
  grade: string;
  summary: string;
  breakdown: {
    benchmark_score: number;
    anomaly_score: number;
    growth_score: number;
  };
  anomalies_active: number;
  overall_percentile: number;
  top_priorities: string[];
  snapshot_date: string;
  arr_band: string;
}

export interface Anomaly {
  metric: string;
  severity: "critical" | "warning";
  message: string;
  current_value: number;
  expected_value?: number;
  deviation_pct?: number;
  detected_at: string;
  ai_explanation?: string;
}

// ── Analytics Reports ────────────────────────────────────
export interface AnalyticsReport {
  id: string;
  name: string;
  report_type: string;
  period_days: number;
  schedule?: string;
  status: "ready" | "generating" | "error";
  format: string;
  file_url?: string;
  created_at: string;
}

// ── Correlations ─────────────────────────────────────────
export interface CorrelationReport {
  totals: {
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    overall_ctr: number;
    overall_roas: number;
    overall_cpa: number;
  };
  platform_summary: Record<string, PlatformSummary>;
  campaign_analysis: Campaign[];
  recommendations: AdRecommendation[];
}

export interface PlatformSummary {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  roas: number;
}

export interface Campaign {
  campaign_name: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  roas: number;
  decision: "scale" | "optimize" | "test" | "pause";
  score: number;
}

export interface AdRecommendation {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

// ── Chat / AI Assistant ──────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// ── Pagination ───────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── API Error ────────────────────────────────────────────
export interface ApiError {
  detail: string | { msg: string; type: string }[];
  status?: number;
}
