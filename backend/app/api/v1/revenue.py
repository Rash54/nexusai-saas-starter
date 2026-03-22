# app/api/v1/revenue.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.services.revenue_service import (
    record_revenue_event,
    get_revenue_summary,
    get_mrr_forecast,
    get_runway_analysis,
)
from app.schemas.revenue import (
    RevenueEventCreate, RevenueEventRead,
    RevenueSummary, ForecastResponse, RunwayResponse,
)

router = APIRouter(prefix="/revenue", tags=["Revenue"])


@router.post("/{org_id}/events", response_model=RevenueEventRead, status_code=201)
async def create_revenue_event(
    org_id: UUID,
    data: RevenueEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a revenue event (new subscription, upgrade, churn, etc.)."""
    data.organization_id = org_id
    return await record_revenue_event(db, data)


@router.get("/{org_id}/summary", response_model=RevenueSummary)
async def revenue_summary(
    org_id: UUID,
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """MRR breakdown: new, expansion, contraction, churned, net new. Includes waterfall data."""
    return await get_revenue_summary(db, org_id, days=days)


@router.get("/{org_id}/forecast", response_model=ForecastResponse)
async def mrr_forecast(
    org_id: UUID,
    months: int = Query(default=6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Linear MRR forecast with confidence bands for N months ahead."""
    return await get_mrr_forecast(db, org_id, months=months)


@router.get("/{org_id}/runway", response_model=RunwayResponse)
async def runway_analysis(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Runway analysis under base, optimistic, and pessimistic burn scenarios."""
    return await get_runway_analysis(db, org_id)
