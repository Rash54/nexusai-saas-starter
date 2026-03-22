# app/api/v1/analytics.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.chart import AnalyticsReport

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

REPORT_TYPES = [
    "mrr_breakdown", "growth_cohort", "ai_cost_analysis", "revenue_forecast",
    "churn_analysis", "ltv_report", "acquisition_funnel", "financial_summary",
    "executive_summary",
]


class ReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: str
    period_days: int = 30
    schedule: Optional[str] = None     # none | daily | weekly | monthly
    recipients: Optional[list] = None
    format: str = "pdf"


@router.get("/{org_id}/reports")
async def list_reports(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all analytics reports for an organization."""
    result = await db.execute(
        select(AnalyticsReport).where(
            AnalyticsReport.organization_id == org_id,
            AnalyticsReport.is_active == True,
        ).order_by(AnalyticsReport.created_at.desc())
    )
    reports = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "report_type": r.report_type,
            "period_days": r.period_days,
            "schedule": r.schedule,
            "status": r.status,
            "format": r.format,
            "file_url": r.file_url,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.post("/{org_id}/reports", status_code=201)
async def create_report(
    org_id: UUID,
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create and schedule an analytics report."""
    if data.report_type not in REPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid report type. Options: {REPORT_TYPES}")

    report = AnalyticsReport(
        organization_id=org_id,
        created_by=current_user.id,
        name=data.name,
        description=data.description,
        report_type=data.report_type,
        period_days=data.period_days,
        schedule=data.schedule,
        recipients=data.recipients,
        format=data.format,
        status="ready",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return {"report_id": str(report.id), "status": "created"}


@router.post("/{org_id}/reports/{report_id}/generate")
async def generate_report(
    org_id: UUID,
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate/export an analytics report."""
    result = await db.execute(select(AnalyticsReport).where(AnalyticsReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # TODO: Queue Celery task for actual PDF/CSV generation
    report.status = "generating"
    report.last_generated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "generating", "message": "Report generation queued. You'll be notified when ready."}


@router.get("/{org_id}/executive-summary")
async def executive_summary(
    org_id: UUID,
    days: int = Query(default=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full executive summary — all metrics in one structured report."""
    from app.services.metric_service import get_metric_summary
    from app.services.ai_service import get_ai_usage_summary
    from app.services.growth_service import get_growth_summary
    from app.services.revenue_service import get_revenue_summary, get_mrr_forecast

    metrics = await get_metric_summary(db, org_id)
    ai_usage = await get_ai_usage_summary(db, org_id, days=days)
    growth = await get_growth_summary(db, org_id, days=days)
    revenue = await get_revenue_summary(db, org_id, days=days)
    forecast = await get_mrr_forecast(db, org_id, months=3)

    return {
        "period_days": days,
        "generated_at": datetime.now(timezone.utc),
        "financial": {
            "mrr": metrics.mrr if metrics else 0,
            "mrr_growth_pct": metrics.mrr_delta_pct if metrics else 0,
            "arr": metrics.arr if metrics else 0,
            "net_new_mrr": revenue.net_new_mrr,
            "new_mrr": revenue.new_mrr,
            "churned_mrr": revenue.churned_mrr,
        },
        "customers": {
            "total": metrics.total_customers if metrics else 0,
            "new": metrics.customer_delta if metrics else 0,
            "churn_rate": metrics.churn_rate if metrics else 0,
            "nrr": metrics.net_revenue_retention if metrics else 0,
        },
        "unit_economics": {
            "arpu": 0,
            "ltv": 0,
            "cac": 0,
            "ltv_cac_ratio": metrics.ltv_cac_ratio if metrics else 0,
        },
        "cash": {
            "runway_months": metrics.runway_months if metrics else 0,
            "burn_rate": metrics.burn_rate if metrics else 0,
        },
        "ai_costs": {
            "total_usd": ai_usage.total_cost_usd,
            "total_tokens": ai_usage.total_tokens,
            "top_model": ai_usage.top_models[0] if ai_usage.top_models else None,
        },
        "growth": {
            "signups": growth.total_signups,
            "activation_rate": growth.activation_rate,
            "trial_to_paid": growth.trial_to_paid_rate,
        },
        "forecast": {
            "projected_mrr_3mo": forecast.summary.get("projected_eom_mrr", 0) if forecast.summary else 0,
            "growth_rate_pct": forecast.summary.get("monthly_growth_rate_pct", 0) if forecast.summary else 0,
        },
    }
