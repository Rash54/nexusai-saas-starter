# app/api/v1/metrics.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.services.metric_service import (
    upsert_metric_snapshot,
    get_metric_summary,
    get_metric_trend,
    get_latest_snapshot,
)
from app.schemas.metric import (
    MetricSnapshotCreate,
    MetricSnapshotRead,
    MetricSummary,
    MetricTrendResponse,
)

router = APIRouter(prefix="/metrics", tags=["Metrics"])

VALID_METRICS = [
    "mrr", "arr", "new_mrr", "churned_mrr", "net_new_mrr",
    "total_customers", "churn_rate", "net_revenue_retention",
    "arpu", "ltv", "cac", "ltv_cac_ratio",
    "burn_rate", "runway_months", "cash_balance",
    "mrr_growth_rate", "customer_growth_rate",
]


@router.post("/{org_id}/snapshot", response_model=MetricSnapshotRead, status_code=201)
async def create_snapshot(
    org_id: UUID,
    data: MetricSnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upsert a daily metric snapshot for an organization."""
    data.organization_id = org_id
    return await upsert_metric_snapshot(db, data)


@router.get("/{org_id}/summary", response_model=MetricSummary)
async def metric_summary(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current metric values with period-over-period deltas."""
    return await get_metric_summary(db, org_id)


@router.get("/{org_id}/trend/{metric}", response_model=MetricTrendResponse)
async def metric_trend(
    org_id: UUID,
    metric: str,
    days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get time-series data for any metric over a given period."""
    from fastapi import HTTPException
    if metric not in VALID_METRICS:
        raise HTTPException(status_code=400, detail=f"Invalid metric. Valid options: {VALID_METRICS}")

    trend_data = await get_metric_trend(db, org_id, metric, days)
    return MetricTrendResponse(metric=metric, period_days=days, data=trend_data)


@router.get("/{org_id}/latest", response_model=MetricSnapshotRead)
async def latest_snapshot(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent metric snapshot."""
    from fastapi import HTTPException
    snap = await get_latest_snapshot(db, org_id)
    if not snap:
        raise HTTPException(status_code=404, detail="No metric snapshots found")
    return snap
