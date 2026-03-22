# NEXU AI — Frontend

AI-powered business intelligence dashboard built with Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Zustand, and React Query.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your backend URL

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## 🔑 Environment Variables

All backend URLs live in `.env.local` — **never hardcoded anywhere in the project.**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000      # Your FastAPI backend
NEXT_PUBLIC_API_BASE=/api/v1                   # API prefix
NEXT_PUBLIC_APP_NAME=NEXU
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> ⚠️ **Never commit `.env.local` to version control.**

---

## 🗂️ Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Authenticated layout group
│   │   ├── layout.tsx          # Sidebar + Topbar + AI Chat
│   │   ├── loading.tsx         # Shared page skeleton
│   │   ├── dashboard/          # Main dashboard
│   │   ├── analytics/          # Analytics & reports
│   │   ├── ai-insights/        # AI Insights, anomalies, benchmarks
│   │   ├── revenue/            # MRR, forecast, waterfall, runway
│   │   ├── growth/             # Signups, retention, channels
│   │   ├── correlations/       # Ad spend → revenue analysis
│   │   ├── metrics/            # All SaaS KPIs
│   │   ├── tasks/              # Kanban board
│   │   ├── upload/             # File upload + AI analysis
│   │   ├── integrations/       # Stripe, GA4, HubSpot, etc.
│   │   ├── team/               # Members & invites
│   │   ├── notifications/      # Alerts & notification feed
│   │   ├── billing/            # Plans, usage, invoices
│   │   ├── settings/           # Profile, org, preferences
│   │   └── organizations/      # Org management
│   ├── login/                  # Auth — login page
│   ├── register/               # Auth — register page
│   ├── invite/accept/          # Team invite acceptance
│   ├── not-found.tsx           # 404 page
│   ├── global-error.tsx        # Error boundary
│   ├── globals.css             # Design system tokens (light + dark)
│   ├── layout.tsx              # Root layout
│   └── providers.tsx           # QueryClient + ThemeProvider + Toaster
│
├── components/
│   ├── ai/
│   │   └── NexuAIChat.tsx      # Floating AI chat panel (GPT-4 + Claude)
│   ├── dashboard/
│   │   └── StatCard.tsx        # Stat card with sparkline
│   ├── layout/
│   │   ├── Sidebar.tsx         # Collapsible desktop sidebar
│   │   ├── Topbar.tsx          # Search, theme, notifications, user menu
│   │   ├── MobileBottomNav.tsx # Mobile bottom tab bar
│   │   └── MobileSidebar.tsx   # Mobile slide-in drawer
│   └── ui/
│       └── NexuLogo.tsx        # NEXU brand logo + wordmark
│
├── services/
│   └── api.ts                  # ALL backend routes — single source of truth
│
├── hooks/
│   └── useApi.ts               # React Query hooks for every API call
│
├── store/
│   ├── authStore.ts            # Zustand — auth state + JWT cookie management
│   └── uiStore.ts              # Zustand — sidebar, theme, chat state
│
├── lib/
│   ├── axios.ts                # Axios instance with JWT interceptors + auto-refresh
│   └── utils.ts                # cn(), formatCurrency, formatDate, etc.
│
├── types/
│   └── index.ts                # TypeScript types mirroring backend schemas
│
└── middleware.ts               # Next.js route protection (JWT check)
```

---

## 🎨 Design System

- **Theme**: Full light + dark mode via `next-themes` + CSS variables
- **Colors**: NEXU brand blue (`#4f63f7`) + semantic tokens in `globals.css`
- **Fonts**: DM Sans (body) + Syne (display/headings) + JetBrains Mono (code)
- **Responsive**: Mobile-first — bottom nav on mobile, collapsible sidebar on tablet, full sidebar on desktop

---

## 📡 API Layer

All API calls go through `src/services/api.ts`. **No URLs anywhere else.**

```typescript
// Example usage in a component
import { dashboardApi } from "@/services/api";
const { data } = useQuery({
  queryKey: ["dashboard", orgId],
  queryFn: () => dashboardApi.getSummary(orgId).then(r => r.data),
});
```

Available API namespaces:
- `authApi` — login, register, me
- `dashboardApi` — master dashboard summary
- `metricsApi` — KPI snapshots and trends
- `revenueApi` — MRR, forecast, runway
- `growthApi` — signups, activation, cohorts
- `analyticsApi` — reports, executive summary
- `insightsApi` — benchmarks, health score, anomalies, what-if
- `correlationsApi` — ad spend analysis, campaign leaderboard
- `recommendationsApi` — AI recommendations
- `integrationsApi` — Stripe, GA4, HubSpot, OpenAI, Anthropic, etc.
- `uploadsApi` — file upload, status polling, rows
- `teamApi` — members, invites, roles
- `notificationsApi` — notifications, alert rules
- `settingsApi` — profile, org settings
- `supportApi` — tickets, FAQ
- `adminApi` — audit logs, system overview
- `aiChatApi` — AI chat routing
- `chartsApi` — saved charts
- `aiUsageApi` — AI token usage
- `healthApi` — health check

---

## 🔐 Authentication

- JWT stored in **httpOnly cookies** (`access_token`, `refresh_token`)
- Auto-refresh on 401 via Axios interceptor in `lib/axios.ts`
- Route protection via `middleware.ts` — unauthenticated users redirect to `/login`
- Auth state in Zustand `authStore` — persisted to localStorage

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 640px` (mobile) | Bottom tab nav, full-screen chat, single column cards |
| `640–1024px` (tablet) | Collapsed icon sidebar, 2-column grids |
| `> 1024px` (desktop) | Full sidebar with labels, all panels visible |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Data fetching | React Query (TanStack) |
| HTTP | Axios |
| Auth | JWT in cookies + Next.js middleware |
| AI Chat | React Markdown + streaming |
| File upload | React Dropzone |
| Icons | Lucide React |
| Theme | next-themes |
| Toasts | react-hot-toast |

---

## 🚢 Production Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

For Vercel deployment, set the environment variables in the Vercel dashboard. The `NEXT_PUBLIC_API_URL` should point to your production FastAPI backend.

---

## 📝 Notes

- The NEXU AI chat panel currently simulates streaming. Wire `aiChatApi` in `services/api.ts` to your backend's `/insights` or `/recommendations` endpoints for real AI responses.
- All chart data falls back to mock values when the backend returns no data — making the UI always look great during development.
- The `org_id` is stored in cookies and Zustand. Your backend uses it for all multi-tenant queries.
