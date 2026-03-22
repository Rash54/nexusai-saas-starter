# app/schemas/growth.py

from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Dict
from uuid import UUID


class GrowthEventCreate(BaseModel):
    organization_id: UUID
    event_type: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    acquisition_channel: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    plan: Optional[str] = None
    feature_name: Optional[str] = None
    is_power_user: bool = False
    session_id: Optional[str] = None
    extra: Optional[Dict] = None


class GrowthEventRead(GrowthEventCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class FunnelStage(BaseModel):
    stage: str
    count: int
    conversion_rate: float   # % from previous stage


class GrowthSummary(BaseModel):
    """Growth & activation funnel summary."""
    total_signups: int
    signups_delta: int
    signups_delta_pct: float
    activated_users: int
    activation_rate: float
    paying_users: int
    trial_to_paid_rate: float
    funnel: List[FunnelStage]
    signups_by_channel: Dict[str, int]
    signups_by_day: List[Dict]       # [{date, count}]
    top_countries: List[Dict]        # [{country, count}]
    power_user_count: int
    period_days: int


class CohortRow(BaseModel):
    cohort_month: str
    cohort_size: int
    retention_by_month: List[float]   # [100%, 80%, 65%, ...]
