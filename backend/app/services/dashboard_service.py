# app/services/dashboard_service.py — Community Edition

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.organization import Organization
from app.db.models.recommendation import Recommendation
from app.services.metric_service import get_metric_summary
from app.services.growth_service import get_growth_summary
from app.schemas.recommendation import DashboardSummary


async def get_dashboard_summary(db: AsyncSession, org_id: UUID) -> DashboardSummary:
    """Aggregate key metrics into a single dashboard payload."""

    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Organization not found")

    metrics, growth = await asyncio.gather(
        get_metric_summary(db, org_id),
        get_growth_summary(db, org_id, days=30),
    )

    rec_result = await db.execute(
        select(Recommendation)
        .where(
            Recommendation.organization_id == org_id,
            Recommendation.is_dismissed == False,
        )
        .order_by(Recommendation.urgency_score.desc())
        .limit(3)
    )
    recs = rec_result.scalars().all()
    top_recs = [
        {
            "id": str(r.id),
            "category": r.category,
            "title": r.title,
            "summary": r.summary,
            "impact_score": r.impact_score,
            "urgency_score": r.urgency_score,
        }
        for r in recs
    ]

    alerts = []
    if metrics:
        if metrics.churn_rate > 5.0:
            alerts.append({"level": "warning", "message": f"Churn rate is {metrics.churn_rate:.1f}% — above 5% threshold", "metric": "churn_rate"})
        if metrics.runway_months < 6.0:
            alerts.append({"level": "critical", "message": f"Runway is {metrics.runway_months:.1f} months — raise or cut burn", "metric": "runway_months"})
        if metrics.ltv_cac_ratio < 3.0:
            alerts.append({"level": "warning", "message": f"LTV:CAC ratio is {metrics.ltv_cac_ratio:.1f}x — target is 3x+", "metric": "ltv_cac_ratio"})
        if metrics.mrr_delta_pct < 0:
            alerts.append({"level": "critical", "message": f"MRR declined {abs(metrics.mrr_delta_pct):.1f}% vs last period", "metric": "mrr"})

    return DashboardSummary(
        organization_id=org_id,
        organization_name=org.name,
        as_of=datetime.now(timezone.utc),
        mrr=metrics.mrr if metrics else 0.0,
        mrr_growth_pct=metrics.mrr_delta_pct if metrics else 0.0,
        arr=metrics.arr if metrics else 0.0,
        total_customers=metrics.total_customers if metrics else 0,
        active_customers=metrics.total_customers if metrics else 0,
        churn_rate=metrics.churn_rate if metrics else 0.0,
        net_revenue_retention=metrics.net_revenue_retention if metrics else 0.0,
        ltv_cac_ratio=metrics.ltv_cac_ratio if metrics else 0.0,
        runway_months=metrics.runway_months if metrics else 0.0,
        burn_rate=metrics.burn_rate if metrics else 0.0,
        # AI costs — zeroed in Community Edition
        ai_total_cost_mtd=0.0,
        ai_total_tokens_mtd=0,
        ai_requests_mtd=0,
        # Growth
        signups_mtd=growth.total_signups,
        activation_rate=growth.activation_rate,
        trial_to_paid_rate=growth.trial_to_paid_rate,
        top_recommendations=top_recs,
        alerts=alerts,
    )
