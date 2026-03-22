# app/services/metric_service.py

from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.models.metric import MetricSnapshot
from app.schemas.metric import MetricSummary, MetricTrend, MetricSnapshotCreate


async def upsert_metric_snapshot(db: AsyncSession, data: MetricSnapshotCreate) -> MetricSnapshot:
    """Insert or update a daily metric snapshot."""
    result = await db.execute(
        select(MetricSnapshot).where(
            MetricSnapshot.organization_id == data.organization_id,
            MetricSnapshot.snapshot_date == data.snapshot_date,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        for k, v in data.model_dump(exclude={"organization_id", "snapshot_date"}).items():
            setattr(existing, k, v)
        await db.commit()
        await db.refresh(existing)
        return existing

    snapshot = MetricSnapshot(**data.model_dump())
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_latest_snapshot(db: AsyncSession, org_id: UUID) -> Optional[MetricSnapshot]:
    result = await db.execute(
        select(MetricSnapshot)
        .where(MetricSnapshot.organization_id == org_id)
        .order_by(desc(MetricSnapshot.snapshot_date))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_metric_trend(
    db: AsyncSession, org_id: UUID, metric: str, days: int = 30
) -> List[MetricTrend]:
    since = date.today() - timedelta(days=days)
    result = await db.execute(
        select(MetricSnapshot)
        .where(
            MetricSnapshot.organization_id == org_id,
            MetricSnapshot.snapshot_date >= since,
        )
        .order_by(MetricSnapshot.snapshot_date)
    )
    snapshots = result.scalars().all()
    return [
        MetricTrend(date=s.snapshot_date, value=getattr(s, metric, 0.0) or 0.0)
        for s in snapshots
    ]


async def get_metric_summary(db: AsyncSession, org_id: UUID) -> Optional[MetricSummary]:
    # Get latest and previous snapshot for delta calculations
    result = await db.execute(
        select(MetricSnapshot)
        .where(MetricSnapshot.organization_id == org_id)
        .order_by(desc(MetricSnapshot.snapshot_date))
        .limit(2)
    )
    snapshots = result.scalars().all()

    if not snapshots:
        return None

    current = snapshots[0]
    previous = snapshots[1] if len(snapshots) > 1 else None

    def delta(cur, prev, field):
        c = getattr(cur, field) or 0.0
        p = getattr(prev, field) or 0.0 if prev else 0.0
        return c - p

    def delta_pct(cur, prev, field):
        c = getattr(cur, field) or 0.0
        p = getattr(prev, field) or 0.0 if prev else 0.0
        if p == 0:
            return 0.0
        return round(((c - p) / p) * 100, 2)

    return MetricSummary(
        mrr=current.mrr or 0.0,
        mrr_delta=delta(current, previous, "mrr"),
        mrr_delta_pct=delta_pct(current, previous, "mrr"),
        arr=current.arr or 0.0,
        total_customers=current.total_customers or 0,
        customer_delta=int(delta(current, previous, "total_customers")),
        churn_rate=current.churn_rate or 0.0,
        churn_rate_delta=delta(current, previous, "churn_rate"),
        net_revenue_retention=current.net_revenue_retention or 0.0,
        ltv_cac_ratio=current.ltv_cac_ratio or 0.0,
        runway_months=current.runway_months or 0.0,
        burn_rate=current.burn_rate or 0.0,
        as_of_date=current.snapshot_date,
    )
