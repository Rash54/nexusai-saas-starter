# app/services/revenue_service.py

from datetime import datetime, timedelta, timezone, date
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.revenue_event import RevenueEvent
from app.db.models.metric import MetricSnapshot
from app.schemas.revenue import (
    RevenueSummary, RevenueEventCreate,
    ForecastPoint, ForecastResponse, RunwayScenario, RunwayResponse
)


async def record_revenue_event(db: AsyncSession, data: RevenueEventCreate) -> RevenueEvent:
    event = RevenueEvent(**data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def get_revenue_summary(db: AsyncSession, org_id: UUID, days: int = 30) -> RevenueSummary:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(RevenueEvent).where(
            RevenueEvent.organization_id == org_id,
            RevenueEvent.created_at >= since,
        )
    )
    events = result.scalars().all()

    # MRR components
    new_mrr = sum(e.mrr_impact for e in events if e.event_type == "new_subscription")
    expansion_mrr = sum(e.mrr_impact for e in events if e.event_type == "upgrade")
    contraction_mrr = abs(sum(e.mrr_impact for e in events if e.event_type == "downgrade"))
    churned_mrr = abs(sum(e.mrr_impact for e in events if e.event_type == "churn"))
    net_new_mrr = new_mrr + expansion_mrr - contraction_mrr - churned_mrr

    # MRR by plan
    mrr_by_plan: dict = {}
    for e in events:
        if e.plan_name and e.event_type == "new_subscription":
            mrr_by_plan[e.plan_name] = mrr_by_plan.get(e.plan_name, 0.0) + e.mrr_impact

    # Waterfall
    waterfall = [
        {"label": "New MRR", "value": round(new_mrr, 2), "type": "positive"},
        {"label": "Expansion", "value": round(expansion_mrr, 2), "type": "positive"},
        {"label": "Contraction", "value": round(-contraction_mrr, 2), "type": "negative"},
        {"label": "Churned", "value": round(-churned_mrr, 2), "type": "negative"},
        {"label": "Net New MRR", "value": round(net_new_mrr, 2), "type": "total"},
    ]

    # Revenue by day
    daily: dict = {}
    for e in events:
        d = e.created_at.date().isoformat()
        if d not in daily:
            daily[d] = {"date": d, "mrr": 0.0, "new_mrr": 0.0, "churned_mrr": 0.0}
        if e.event_type == "new_subscription":
            daily[d]["new_mrr"] += e.mrr_impact
            daily[d]["mrr"] += e.mrr_impact
        elif e.event_type == "churn":
            daily[d]["churned_mrr"] += abs(e.mrr_impact)

    revenue_by_day = sorted(daily.values(), key=lambda x: x["date"])

    # Get current MRR from latest snapshot
    snap_result = await db.execute(
        select(MetricSnapshot)
        .where(MetricSnapshot.organization_id == org_id)
        .order_by(MetricSnapshot.snapshot_date.desc())
        .limit(1)
    )
    snap = snap_result.scalar_one_or_none()
    current_mrr = snap.mrr if snap else 0.0

    return RevenueSummary(
        mrr=current_mrr,
        arr=current_mrr * 12,
        new_mrr=round(new_mrr, 2),
        expansion_mrr=round(expansion_mrr, 2),
        contraction_mrr=round(contraction_mrr, 2),
        churned_mrr=round(churned_mrr, 2),
        net_new_mrr=round(net_new_mrr, 2),
        mrr_by_plan={k: round(v, 2) for k, v in mrr_by_plan.items()},
        mrr_movement_waterfall=waterfall,
        revenue_by_day=revenue_by_day,
        period_days=days,
    )


async def get_mrr_forecast(db: AsyncSession, org_id: UUID, months: int = 6) -> ForecastResponse:
    """Simple linear growth forecast based on last 90 days of MRR snapshots."""
    from sqlalchemy import asc

    result = await db.execute(
        select(MetricSnapshot)
        .where(MetricSnapshot.organization_id == org_id)
        .order_by(asc(MetricSnapshot.snapshot_date))
        .limit(90)
    )
    snapshots = result.scalars().all()

    if len(snapshots) < 2:
        return ForecastResponse(
            metric="mrr", model="linear", confidence=0.0,
            data=[], summary={}
        )

    # Calculate average daily MRR growth
    first_mrr = snapshots[0].mrr or 0.0
    last_mrr = snapshots[-1].mrr or 0.0
    days_elapsed = (snapshots[-1].snapshot_date - snapshots[0].snapshot_date).days or 1
    daily_growth = (last_mrr - first_mrr) / days_elapsed

    # Actuals
    data: List[ForecastPoint] = [
        ForecastPoint(
            date=s.snapshot_date,
            predicted_value=s.mrr or 0.0,
            lower_bound=s.mrr or 0.0,
            upper_bound=s.mrr or 0.0,
            is_actual=True,
        )
        for s in snapshots[-30:]  # last 30 days of actuals
    ]

    # Forecast
    base_date = snapshots[-1].snapshot_date
    base_mrr = last_mrr
    monthly_growth_rate = (daily_growth * 30) / base_mrr if base_mrr > 0 else 0.05

    for i in range(1, months + 1):
        forecast_date = base_date + timedelta(days=30 * i)
        predicted = base_mrr * ((1 + monthly_growth_rate) ** i)
        variance = predicted * 0.10 * i  # widen confidence interval over time
        data.append(ForecastPoint(
            date=forecast_date,
            predicted_value=round(predicted, 2),
            lower_bound=round(max(0, predicted - variance), 2),
            upper_bound=round(predicted + variance, 2),
            is_actual=False,
        ))

    projected_eom = round(base_mrr * ((1 + monthly_growth_rate) ** 1), 2)

    return ForecastResponse(
        metric="mrr",
        model="linear",
        confidence=0.75,
        data=data,
        summary={
            "current_mrr": round(base_mrr, 2),
            "projected_eom_mrr": projected_eom,
            "monthly_growth_rate_pct": round(monthly_growth_rate * 100, 2),
            "projected_arr": round(projected_eom * 12, 2),
        },
    )


async def get_runway_analysis(db: AsyncSession, org_id: UUID) -> RunwayResponse:
    """Calculate runway under 3 scenarios."""
    result = await db.execute(
        select(MetricSnapshot)
        .where(MetricSnapshot.organization_id == org_id)
        .order_by(MetricSnapshot.snapshot_date.desc())
        .limit(1)
    )
    snap = result.scalar_one_or_none()

    cash = snap.cash_balance if snap else 0.0
    burn = snap.burn_rate if snap else 0.0
    mrr = snap.mrr if snap else 0.0

    def runway(cash_bal, burn_rate):
        if burn_rate <= 0:
            return 999.0
        return round(cash_bal / burn_rate, 1)

    scenarios = [
        RunwayScenario(
            scenario="base",
            burn_rate=burn,
            cash_balance=cash,
            runway_months=runway(cash, burn),
        ),
        RunwayScenario(
            scenario="optimistic",
            burn_rate=burn * 0.85,
            cash_balance=cash,
            runway_months=runway(cash, burn * 0.85),
        ),
        RunwayScenario(
            scenario="pessimistic",
            burn_rate=burn * 1.20,
            cash_balance=cash,
            runway_months=runway(cash, burn * 1.20),
        ),
    ]

    # Monthly projection (12 months)
    monthly = []
    for i in range(13):
        month_mrr = mrr * (1.05 ** i)  # assume 5% MoM growth
        net_burn = max(0, burn - month_mrr)
        remaining_cash = max(0, cash - (burn * i))
        monthly.append({
            "month": i,
            "cash": round(remaining_cash, 2),
            "mrr": round(month_mrr, 2),
            "burn": round(net_burn, 2),
        })

    return RunwayResponse(
        current_cash=cash,
        current_burn=burn,
        current_runway_months=runway(cash, burn),
        scenarios=scenarios,
        monthly_projection=monthly,
    )
