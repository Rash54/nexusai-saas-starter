# NexusAI SaaS Dashboard — Backend

A production-grade FastAPI backend for AI-powered SaaS analytics.  
Connects to PostgreSQL (Neon), Redis, Stripe, HubSpot, GA4, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 + Uvicorn |
| Database | PostgreSQL (Neon) via SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Background Jobs | Celery + Redis |
| File Parsing | openpyxl + csv (Phase 1) |
| AI | Anthropic Claude + OpenAI GPT-4 |
| Email | Resend |
| Payments | Stripe |
| Encryption | Fernet (AES-128) for stored API keys |

---

## Project Structure

```
backend-ecommerce/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── api/
│   │   └── v1/
│   │       ├── api.py             # Master router (all routes registered here)
│   │       ├── auth.py            # Register, login, JWT
│   │       ├── dashboard.py       # Dashboard summary endpoint
│   │       ├── metrics.py         # Metric snapshots
│   │       ├── analytics.py       # Reports + scheduling
│   │       ├── revenue.py         # Revenue events
│   │       ├── growth.py          # Growth events + funnel
│   │       ├── ai_usage.py        # AI token/cost tracking
│   │       ├── recommendations.py # AI recommendations
│   │       ├── integrations.py    # Native integrations (Phase 3)
│   │       ├── uploads.py         # File upload + AI insights (Phase 1)
│   │       ├── correlations.py    # Ad spend → revenue (Phase 2)
│   │       ├── insights.py        # Benchmarks + what-if + anomalies (Phase 4)
│   │       ├── payments.py        # Stripe billing
│   │       ├── team.py            # Team invites + members
│   │       ├── notifications.py   # In-app notifications
│   │       ├── settings.py        # Org + user settings
│   │       ├── charts.py          # Chart configs
│   │       ├── users.py           # User management
│   │       ├── admin.py           # Admin panel routes
│   │       ├── support.py         # Support tickets
│   │       └── health.py          # Health check
│   ├── core/
│   │   ├── config.py              # All env vars via pydantic-settings
│   │   ├── security.py            # JWT + password hashing
│   │   ├── celery_app.py          # Celery + beat schedule
│   │   └── logging.py             # Structured logging
│   ├── db/
│   │   ├── base.py                # SQLAlchemy base + UUID model
│   │   └── models/
│   │       ├── user.py
│   │       ├── organization.py
│   │       ├── organization_membership.py
│   │       ├── metric.py          # MetricSnapshot (daily KPIs)
│   │       ├── revenue_event.py
│   │       ├── growth_event.py
│   │       ├── ai_usage.py
│   │       ├── recommendation.py
│   │       ├── integration.py     # Integration + WebhookEvent
│   │       ├── upload.py          # DataUpload + UploadedRow + AdCampaignMetric
│   │       ├── notification.py    # Notification + AlertRule + AlertEvent
│   │       ├── payment.py         # Plan + Subscription + PaymentMethod
│   │       ├── task.py
│   │       ├── team.py            # TeamInvite + AuditLog + BrandingSettings
│   │       └── chart.py           # ChartConfig + AnalyticsReport
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── dashboard_service.py
│   │   ├── metric_service.py
│   │   ├── revenue_service.py
│   │   ├── growth_service.py
│   │   ├── email_service.py       # Resend transactional emails
│   │   ├── anomaly_service.py     # Z-score anomaly detection + AI explanations
│   │   ├── recommendation_service.py  # Rule-based AI recommendations
│   │   ├── integration_manager.py # Encrypted credential manager
│   │   ├── upload_service.py      # File upload pipeline (Phase 1)
│   │   ├── correlation_service.py # Ad spend → revenue correlation (Phase 2)
│   │   ├── benchmarks.py          # SaaS industry benchmark database (Phase 4)
│   │   ├── whatif_service.py      # Multi-metric projection engine (Phase 4)
│   │   ├── ai/
│   │   │   └── insight_service.py # Dual AI: Claude deep + GPT-4 quick
│   │   ├── parsers/
│   │   │   ├── column_detector.py # Auto-detect upload type from columns
│   │   │   └── file_parser.py     # CSV + Excel parser + normaliser
│   │   └── integrations/
│   │       ├── stripe_service.py  # MRR sync + webhook processing
│   │       ├── hubspot_service.py # Contacts + deals sync (Phase 3)
│   │       ├── ga4_service.py     # Google Analytics 4 live data (Phase 3)
│   │       ├── analytics_service.py  # PostHog + Mixpanel
│   │       ├── banking_service.py # Plaid + Mercury
│   │       ├── ai_provider_service.py # OpenAI + Anthropic usage sync
│   │       └── sync_scheduler.py  # Auto-sync orchestrator (Phase 3)
│   ├── schemas/                   # Pydantic request/response models
│   ├── tasks/                     # Celery async tasks
│   │   ├── metric_tasks.py        # Hourly metric sync + anomaly detection
│   │   ├── forecast_tasks.py      # AI recommendations + weekly digest
│   │   └── cleanup_tasks.py       # Expire invites, prune old data
│   ├── middleware/
│   │   ├── rate_limit.py          # Sliding window rate limiting
│   │   └── performance.py         # Request timing
│   ├── utils/
│   │   ├── encryption.py          # Fernet AES-128 for API key storage
│   │   ├── pagination.py
│   │   └── time.py
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       └── test_health.py
├── alembic/
│   ├── env.py                     # Async Alembic config
│   └── versions/
│       ├── 0001_initial_schema.py # 22 tables + seed plans
│       └── 0002_upload_tables.py  # 3 upload tables (Phase 1)
├── .env.example                   # Copy to .env and fill in
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## Database Schema — 25 Tables

### Core
- `users` — accounts with JWT auth
- `organizations` — multi-tenant workspaces
- `organization_memberships` — user ↔ org with roles

### Metrics & Revenue
- `metric_snapshots` — daily KPI snapshots (MRR, ARR, churn, LTV, CAC, runway)
- `revenue_events` — individual revenue transactions
- `growth_events` — user lifecycle events (signup, activate, churn)
- `ai_usage_logs` — token usage and cost per model

### Plans & Billing
- `plans` — Starter $29 / Pro $79 / Enterprise $199
- `subscriptions` — org plan subscriptions
- `payment_methods` — stored payment methods
- `payment_transactions` — payment history

### Phase 1 — Uploads
- `data_uploads` — file metadata + AI insight results
- `uploaded_rows` — normalised revenue/GA4/custom rows
- `ad_campaign_metrics` — Facebook/Google/TikTok campaign data

### Integrations
- `integrations` — connected providers with encrypted credentials
- `webhook_events` — raw inbound webhook payloads

### Team & Platform
- `team_invites` — email invitations with expiry
- `audit_logs` — full action history
- `notifications` — in-app alerts
- `alert_rules` — custom threshold rules
- `alert_events` — triggered alert log
- `recommendations` — AI-generated action items
- `tasks` — founder task manager
- `chart_configs` — custom dashboard layouts
- `analytics_reports` — scheduled report configs
- `branding_settings`, `user_preferences`, `support_tickets`, `performance_metrics`

---

## API Routes — 100+ Endpoints

All routes are under `/api/v1/`. Full docs at `http://localhost:8000/docs`.

### Auth
```
POST /auth/register          Create account
POST /auth/login             Get JWT token
GET  /auth/me                Current user profile
POST /auth/refresh           Refresh token
```

### Dashboard & Metrics
```
GET  /dashboard/{org_id}/summary          Main dashboard data
GET  /metrics/{org_id}                    Metric snapshots
POST /metrics/{org_id}/snapshot           Create snapshot
GET  /analytics/{org_id}/reports          Scheduled reports
POST /analytics/{org_id}/reports          Create report
POST /analytics/{org_id}/executive-summary  Executive summary
```

### Phase 1 — File Uploads + AI Insights
```
POST /uploads/{org_id}                    Upload CSV or Excel file
GET  /uploads/{org_id}/{upload_id}        Poll status + get AI insights
GET  /uploads/{org_id}                    List all uploads
GET  /uploads/{org_id}/{upload_id}/rows   Parsed revenue/GA4 rows
GET  /uploads/{org_id}/{upload_id}/campaigns  Ad campaign metrics
POST /uploads/{org_id}/{upload_id}/reanalyze  Re-run AI analysis
DELETE /uploads/{org_id}/{upload_id}      Delete upload
```

Supports: Stripe CSV, Facebook/Google/TikTok Ads exports, GA4 reports, custom CSV.  
AI: GPT-4o-mini quick analysis + Claude Sonnet deep narrative (runs in parallel).

### Phase 2 — Ad Correlation & What-If
```
GET  /correlations/{org_id}/report                 Full correlation report
GET  /correlations/{org_id}/platforms              Platform summary
GET  /correlations/{org_id}/campaigns/leaderboard  Campaign scoring (scale/pause/optimize)
GET  /correlations/{org_id}/spend-revenue          Pearson r + regression (multiple lags)
GET  /correlations/{org_id}/spend-traffic          Spend → sessions correlation
POST /correlations/{org_id}/whatif                 Single campaign budget scenario
POST /correlations/{org_id}/whatif/bulk            Up to 20 scenarios at once
POST /correlations/{org_id}/ai-narrative           Claude writes founder ad briefing
GET  /correlations/{org_id}/recommendations        Prioritised ad action plan
```

### Phase 3 — Native Integrations
```
GET  /integrations/{org_id}                  List all providers + connection status
POST /integrations/{org_id}/connect          Connect (encrypts credentials + first sync)
PATCH /integrations/{org_id}/{provider}      Update credentials/settings
DELETE /integrations/{org_id}/{provider}     Disconnect + wipe credentials
POST /integrations/{org_id}/{provider}/sync  Manual sync trigger
POST /integrations/{org_id}/sync-all         Sync all active integrations
GET  /integrations/{org_id}/health/status    Sync health + next-run schedule
POST /integrations/{org_id}/validate/ga4     Validate GA4 before connecting
POST /integrations/{org_id}/validate/hubspot Validate HubSpot token
GET  /integrations/{org_id}/validate/stripe  Validate Stripe key
```

Providers: Stripe · HubSpot · Google Analytics 4 · PostHog · Mixpanel · Plaid · Mercury · OpenAI · Anthropic

### Phase 4 — Advanced Insights
```
GET  /insights/{org_id}/benchmarks                 Full benchmark scorecard
GET  /insights/{org_id}/benchmarks/{metric}        Single metric vs industry
GET  /insights/{org_id}/health-score               Composite 0-100 health score
POST /insights/{org_id}/whatif/scenario            Project impact of one metric change
POST /insights/{org_id}/whatif/compare             Rank multiple scenarios by revenue uplift
POST /insights/{org_id}/whatif/custom              Free-form multi-variable scenario
GET  /insights/{org_id}/anomalies/detect           Real-time anomaly detection
GET  /insights/{org_id}/anomalies/history          Historical anomaly log
POST /insights/{org_id}/anomalies/{metric}/explain Claude explains an anomaly
GET  /insights/{org_id}/segments/acquisition       Traffic by source/medium
GET  /insights/{org_id}/segments/cohorts           Monthly retention cohort table
POST /insights/{org_id}/anomalies/notify           Detect + save notifications
```

### Teams, Notifications, Payments
```
POST /team/{org_id}/invite                  Invite team member (sends email)
GET  /team/{org_id}/members                 List org members
GET  /team/{org_id}/invites                 Pending invites
GET  /notifications                         In-app notifications
POST /notifications/{id}/read               Mark as read
GET  /payments/{org_id}/plans               Available plans
POST /payments/{org_id}/subscription        Subscribe to plan
GET  /payments/{org_id}/invoices            Invoice history
```

---

## Quick Start

### 1. Clone + install
```bash
git clone <your-repo>
cd backend-ecommerce
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SECRET_KEY, and any API keys you have
```

### 3. Run migrations
```bash
alembic upgrade head
# Creates all 25 tables + seeds 3 default plans
```

### 4. Start the server
```bash
# Terminal 1 — API server
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery worker (background jobs)
celery -A app.core.celery_app worker --loglevel=info --pool=solo

# Terminal 3 — Celery beat (scheduled jobs)
celery -A app.core.celery_app beat --loglevel=info
```

### 5. Explore the API
Open `http://localhost:8000/docs` — full interactive Swagger UI.

### 6. Windows-specific
```cmd
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
celery -A app.core.celery_app worker --loglevel=info --pool=solo
celery -A app.core.celery_app beat --loglevel=info
```

---

## Docker

```bash
# Build and run everything
docker compose up --build

# API only (if you have external Redis/DB)
docker build -t nexusai-backend .
docker run -p 8000:8000 --env-file .env nexusai-backend
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection (asyncpg) |
| `DIRECT_DATABASE_URL` | ✅ | Direct URL for Alembic (no pooler) |
| `SECRET_KEY` | ✅ | JWT signing key (min 32 chars) |
| `ENCRYPTION_SALT` | ✅ | Salt for API key encryption |
| `REDIS_URL` | ✅ | Redis for Celery |
| `RESEND_API_KEY` | ⚠️ | Email delivery (team invites, alerts) |
| `STRIPE_SECRET_KEY` | ⚠️ | Payments + MRR sync |
| `OPENAI_API_KEY` | ⚠️ | GPT-4 quick insights on uploads |
| `ANTHROPIC_API_KEY` | ⚠️ | Claude deep insights + anomaly explanations |
| `PLAID_CLIENT_ID` | ⚠️ | Bank balance sync |

✅ = required to start · ⚠️ = required for that feature only

---

## Running Tests

```bash
pytest app/tests/ -v
```

---

## Celery Beat Schedule

| Job | Interval | What it does |
|---|---|---|
| `sync_all_metrics` | Every hour | Pull MRR from Stripe, detect anomalies |
| `sync_ai_costs` | Every hour (offset 15m) | Pull OpenAI/Anthropic usage |
| `sync_growth_events` | Every 6 hours | Pull PostHog/Mixpanel events |
| `generate_forecasts` | Daily 8am | AI recommendations + forecasts |
| `weekly_cleanup` | Sunday 3am | Expire invites, prune old data |
| `sync_all_integrations` | Every hour | Auto-sync all active integrations |

---

## Security Notes

- All integration credentials (API keys, OAuth tokens) are encrypted at rest using **Fernet AES-128** before DB storage
- JWT tokens expire in 60 minutes by default
- Rate limiting: 10 req/60s on login, 5 req/60s on register
- All integrations are **read-only** — the dashboard never writes to your connected tools
- Webhook signatures are verified (Stripe HMAC-SHA256)

---

## Phases Built

| Phase | Feature | Status |
|---|---|---|
| MVP | Core API, auth, metrics, teams, billing | ✅ Complete |
| Phase 1 | CSV/Excel upload → parse → dual AI insights | ✅ Complete |
| Phase 2 | Ad spend → traffic → revenue correlation + what-if | ✅ Complete |
| Phase 3 | Native live integrations (Stripe, HubSpot, GA4, Mixpanel) | ✅ Complete |
| Phase 4 | Benchmarks, multi-metric scenarios, health score | ✅ Complete |

---

## License

Private — all rights reserved.
