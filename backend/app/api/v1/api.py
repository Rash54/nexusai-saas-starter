# app/api/v1/api.py — Free/Community Edition router

from fastapi import APIRouter

# ── Core ──────────────────────────────────────────────────────────────────────
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router

# ── Dashboard & Metrics ───────────────────────────────────────────────────────
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.charts import router as charts_router
from app.api.v1.analytics import router as analytics_router

# ── Business Data ─────────────────────────────────────────────────────────────
from app.api.v1.revenue import router as revenue_router
from app.api.v1.growth import router as growth_router
from app.api.v1.recommendations import router as recommendations_router

# ── Team & Organization ───────────────────────────────────────────────────────
from app.api.v1.team import router as team_router
from app.api.v1.settings import router as settings_router

# ── Platform ──────────────────────────────────────────────────────────────────
from app.api.v1.notifications import router as notifications_router
from app.api.v1.support import router as support_router

# ── Tasks (read-only stub) ────────────────────────────────────────────────────
from app.api.v1.tasks_router import router as tasks_router

# ── Data Uploads (limited stub) ───────────────────────────────────────────────
from app.api.v1.uploads import router as uploads_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(dashboard_router)
api_router.include_router(metrics_router)
api_router.include_router(charts_router)
api_router.include_router(analytics_router)
api_router.include_router(revenue_router)
api_router.include_router(growth_router)
api_router.include_router(recommendations_router)
api_router.include_router(team_router)
api_router.include_router(settings_router)
api_router.include_router(notifications_router)
api_router.include_router(support_router)
api_router.include_router(tasks_router)
api_router.include_router(uploads_router)
