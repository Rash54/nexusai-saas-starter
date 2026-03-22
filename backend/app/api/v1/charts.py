# app/api/v1/charts.py

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
import asyncio
import json

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.chart import ChartConfig
from app.services.metric_service import get_metric_trend, get_metric_summary
from app.services.ai_service import get_ai_usage_summary
from app.services.growth_service import get_growth_summary
from app.services.revenue_service import get_revenue_summary

router = APIRouter(prefix="/charts", tags=["Charts & Analytics"])


class ChartConfigCreate(BaseModel):
    name: str
    chart_type: str
    metric: Optional[str] = None
    metrics: Optional[List[str]] = None
    period_days: int = 30
    group_by: str = "day"
    filters: Optional[dict] = None
    display_options: Optional[dict] = None
    is_public: bool = False
    is_pinned: bool = False
    position: Optional[dict] = None
    refresh_interval_seconds: int = 300


# ── Chart Configs ─────────────────────────────────────────────────────────────

@router.get("/{org_id}/configs")
async def list_chart_configs(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChartConfig).where(ChartConfig.organization_id == org_id)
        .order_by(ChartConfig.is_pinned.desc(), ChartConfig.created_at.desc())
    )
    configs = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "chart_type": c.chart_type,
            "metric": c.metric,
            "metrics": c.metrics,
            "period_days": c.period_days,
            "is_pinned": c.is_pinned,
            "position": c.position,
            "refresh_interval_seconds": c.refresh_interval_seconds,
        }
        for c in configs
    ]


@router.post("/{org_id}/configs", status_code=201)
async def create_chart_config(
    org_id: UUID,
    data: ChartConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chart = ChartConfig(
        organization_id=org_id,
        created_by=current_user.id,
        **data.model_dump(),
    )
    db.add(chart)
    await db.commit()
    await db.refresh(chart)
    return {"id": str(chart.id), "name": chart.name}


@router.delete("/{org_id}/configs/{chart_id}", status_code=204)
async def delete_chart_config(
    org_id: UUID,
    chart_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    result = await db.execute(select(ChartConfig).where(ChartConfig.id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    await db.delete(chart)
    await db.commit()


# ── Pre-built Chart Data Endpoints ────────────────────────────────────────────

@router.get("/{org_id}/mrr-trend")
async def mrr_trend_chart(
    org_id: UUID,
    days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """MRR + ARR trend line chart data."""
    mrr_data = await get_metric_trend(db, org_id, "mrr", days)
    arr_data = await get_metric_trend(db, org_id, "arr", days)
    return {
        "chart_type": "line",
        "series": [
            {"name": "MRR", "data": [{"date": str(p.date), "value": p.value} for p in mrr_data]},
            {"name": "ARR", "data": [{"date": str(p.date), "value": p.value} for p in arr_data]},
        ],
        "period_days": days,
    }


@router.get("/{org_id}/mrr-waterfall")
async def mrr_waterfall_chart(
    org_id: UUID,
    days: int = Query(default=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """MRR movement waterfall chart (new, expansion, contraction, churn)."""
    revenue = await get_revenue_summary(db, org_id, days=days)
    return {
        "chart_type": "waterfall",
        "data": revenue.mrr_movement_waterfall,
        "period_days": days,
    }


@router.get("/{org_id}/churn-trend")
async def churn_trend_chart(
    org_id: UUID,
    days: int = Query(default=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Churn rate trend."""
    churn = await get_metric_trend(db, org_id, "churn_rate", days)
    nrr = await get_metric_trend(db, org_id, "net_revenue_retention", days)
    return {
        "chart_type": "line",
        "series": [
            {"name": "Churn Rate %", "data": [{"date": str(p.date), "value": p.value} for p in churn]},
            {"name": "NRR %", "data": [{"date": str(p.date), "value": p.value} for p in nrr]},
        ],
        "period_days": days,
    }


@router.get("/{org_id}/unit-economics")
async def unit_economics_chart(
    org_id: UUID,
    days: int = Query(default=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """LTV, CAC, and LTV:CAC ratio trends."""
    ltv = await get_metric_trend(db, org_id, "ltv", days)
    cac = await get_metric_trend(db, org_id, "cac", days)
    ratio = await get_metric_trend(db, org_id, "ltv_cac_ratio", days)
    return {
        "chart_type": "combo",
        "series": [
            {"name": "LTV", "type": "bar", "data": [{"date": str(p.date), "value": p.value} for p in ltv]},
            {"name": "CAC", "type": "bar", "data": [{"date": str(p.date), "value": p.value} for p in cac]},
            {"name": "LTV:CAC", "type": "line", "data": [{"date": str(p.date), "value": p.value} for p in ratio]},
        ],
        "period_days": days,
    }


@router.get("/{org_id}/runway-chart")
async def runway_chart(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cash + burn + runway projection chart."""
    from app.services.revenue_service import get_runway_analysis
    runway = await get_runway_analysis(db, org_id)
    return {
        "chart_type": "area",
        "current_runway_months": runway.current_runway_months,
        "scenarios": [s.model_dump() for s in runway.scenarios],
        "monthly_projection": runway.monthly_projection,
    }


@router.get("/{org_id}/ai-cost-breakdown")
async def ai_cost_breakdown_chart(
    org_id: UUID,
    days: int = Query(default=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI spend breakdown by model and feature."""
    usage = await get_ai_usage_summary(db, org_id, days=days)
    return {
        "chart_type": "mixed",
        "cost_by_model": [
            {"label": k, "value": v}
            for k, v in sorted(usage.cost_by_model.items(), key=lambda x: x[1], reverse=True)
        ],
        "cost_by_feature": [
            {"label": k, "value": v}
            for k, v in sorted(usage.cost_by_feature.items(), key=lambda x: x[1], reverse=True)
        ],
        "tokens_by_day": usage.tokens_by_day,
        "period_days": days,
    }


@router.get("/{org_id}/growth-funnel")
async def growth_funnel_chart(
    org_id: UUID,
    days: int = Query(default=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Activation funnel chart data."""
    growth = await get_growth_summary(db, org_id, days=days)
    return {
        "chart_type": "funnel",
        "data": [
            {"stage": f.stage, "count": f.count, "conversion_rate": f.conversion_rate}
            for f in growth.funnel
        ],
        "signups_by_channel": [
            {"channel": k, "count": v}
            for k, v in sorted(growth.signups_by_channel.items(), key=lambda x: x[1], reverse=True)
        ],
        "period_days": days,
    }


# ── Server-Sent Events: Real-time Data Stream ─────────────────────────────────

@router.get("/{org_id}/stream")
async def realtime_metrics_stream(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Server-Sent Events endpoint for real-time dashboard updates.
    Frontend connects once and receives live metric pushes.
    """
    async def event_generator():
        while True:
            try:
                summary = await get_metric_summary(db, org_id)
                if summary:
                    data = {
                        "mrr": summary.mrr,
                        "arr": summary.arr,
                        "churn_rate": summary.churn_rate,
                        "total_customers": summary.total_customers,
                        "runway_months": summary.runway_months,
                        "timestamp": summary.as_of_date.isoformat(),
                    }
                    yield f"data: {json.dumps(data)}\n\n"
            except Exception:
                yield f"data: {json.dumps({'error': 'stream error'})}\n\n"

            await asyncio.sleep(30)  # push update every 30 seconds

    return StreamingResponse(event_generator(), media_type="text/event-stream")
