# app/main.py

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.v1.api import api_router
from app.middleware.performance import PerformanceMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


async def _keep_db_alive():
    """Ping the DB every 60 seconds to prevent Neon cold starts."""
    from sqlalchemy import text
    from app.database.session import get_db_context
    while True:
        await asyncio.sleep(60)  # 60s — Neon sleeps after ~5 min idle
        try:
            async with get_db_context() as db:
                await db.execute(text("SELECT 1"))
        except Exception:
            pass  # non-fatal keepalive


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    # Warm up DB immediately on startup so first request isn't cold
    try:
        from sqlalchemy import text
        from app.database.session import get_db_context
        async with get_db_context() as db:
            await db.execute(text("SELECT 1"))
        logger.info("Database connection warmed up")
    except Exception as e:
        logger.warning(f"DB warmup failed (non-fatal): {e}")
    task = asyncio.create_task(_keep_db_alive())
    yield
    task.cancel()
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## NexusAI SaaS Starter — Community Edition

    Open-source AI SaaS foundation. FastAPI + Next.js + multi-tenant analytics.

    ### Included in Community Edition
    - Authentication (JWT)
    - Dashboard & Metrics
    - Revenue & Growth tracking
    - Analytics & Charts
    - Notifications
    - Data Uploads (5 MB / 500 rows)
    - Team (1 seat)

    ### Pro Edition
    Upgrade at https://yusuf545.gumroad.com/l/ttazrg
    - AI Insights (benchmarks, anomaly detection, what-if scenarios)
    - 9 Native Integrations (Stripe, HubSpot, GA4, PostHog, Mixpanel, Plaid, Mercury, OpenAI, Anthropic)
    - Ad Correlation Engine
    - Unlimited uploads with AI analysis
    - Billing & Subscriptions
    - Full team collaboration (up to 10 seats)
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware (outermost first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(RateLimitMiddleware)

# All routes
app.include_router(api_router)