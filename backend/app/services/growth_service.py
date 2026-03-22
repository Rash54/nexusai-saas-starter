# app/services/growth_service.py

from datetime import datetime, timedelta, timezone, date
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.growth_event import GrowthEvent
from app.schemas.growth import GrowthSummary, FunnelStage, CohortRow


FUNNEL_STAGES = [
    "signup",
    "email_verified",
    "onboarding_complete",
    "first_action",
    "became_paying",
]


async def track_growth_event(db: AsyncSession, data) -> GrowthEvent:
    event = GrowthEvent(**data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def get_growth_summary(db: AsyncSession, org_id: UUID, days: int = 30) -> GrowthSummary:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    prev_since = since - timedelta(days=days)

    result = await db.execute(
        select(GrowthEvent).where(
            GrowthEvent.organization_id == org_id,
            GrowthEvent.created_at >= since,
        )
    )
    events = result.scalars().all()

    prev_result = await db.execute(
        select(GrowthEvent).where(
            GrowthEvent.organization_id == org_id,
            GrowthEvent.created_at >= prev_since,
            GrowthEvent.created_at < since,
            GrowthEvent.event_type == "signup",
        )
    )
    prev_signups = len(prev_result.scalars().all())

    signups = [e for e in events if e.event_type == "signup"]
    paying = [e for e in events if e.event_type == "became_paying"]
    activated = [e for e in events if e.event_type == "onboarding_complete"]
    power_users = [e for e in events if e.is_power_user]

    total_signups = len(signups)
    signup_delta = total_signups - prev_signups
    signup_delta_pct = round((signup_delta / prev_signups * 100) if prev_signups else 0.0, 2)

    # Funnel
    funnel: List[FunnelStage] = []
    stage_counts = {}
    for stage in FUNNEL_STAGES:
        count = len([e for e in events if e.event_type == stage])
        stage_counts[stage] = count

    for i, stage in enumerate(FUNNEL_STAGES):
        count = stage_counts.get(stage, 0)
        prev_count = stage_counts.get(FUNNEL_STAGES[i - 1], 0) if i > 0 else count
        conv = round((count / prev_count * 100) if prev_count > 0 else 0.0, 1)
        funnel.append(FunnelStage(stage=stage, count=count, conversion_rate=conv))

    # Signups by channel
    by_channel: dict = {}
    for e in signups:
        ch = e.acquisition_channel or "direct"
        by_channel[ch] = by_channel.get(ch, 0) + 1

    # Signups by day
    daily: dict = {}
    for e in signups:
        d = e.created_at.date().isoformat()
        daily[d] = daily.get(d, 0) + 1
    signups_by_day = [{"date": k, "count": v} for k, v in sorted(daily.items())]

    # Top countries
    by_country: dict = {}
    for e in signups:
        c = e.country or "Unknown"
        by_country[c] = by_country.get(c, 0) + 1
    top_countries = sorted(
        [{"country": k, "count": v} for k, v in by_country.items()],
        key=lambda x: x["count"], reverse=True
    )[:10]

    return GrowthSummary(
        total_signups=total_signups,
        signups_delta=signup_delta,
        signups_delta_pct=signup_delta_pct,
        activated_users=len(activated),
        activation_rate=round((len(activated) / total_signups * 100) if total_signups else 0.0, 1),
        paying_users=len(paying),
        trial_to_paid_rate=round((len(paying) / total_signups * 100) if total_signups else 0.0, 1),
        funnel=funnel,
        signups_by_channel=by_channel,
        signups_by_day=signups_by_day,
        top_countries=top_countries,
        power_user_count=len(power_users),
        period_days=days,
    )
