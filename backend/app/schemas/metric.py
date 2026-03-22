# app/schemas/metric.py

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID


class MetricSnapshotCreate(BaseModel):
    organization_id: UUID
    snapshot_date: date
    mrr: float = 0.0
    arr: float = 0.0
    new_mrr: float = 0.0
    expansion_mrr: float = 0.0
    contraction_mrr: float = 0.0
    churned_mrr: float = 0.0
    net_new_mrr: float = 0.0
    total_customers: int = 0
    new_customers: int = 0
    churned_customers: int = 0
    active_customers: int = 0
    churn_rate: float = 0.0
    revenue_churn_rate: float = 0.0
    net_revenue_retention: float = 0.0
    gross_revenue_retention: float = 0.0
    arpu: float = 0.0
    ltv: float = 0.0
    cac: float = 0.0
    ltv_cac_ratio: float = 0.0
    mrr_growth_rate: float = 0.0
    customer_growth_rate: float = 0.0
    cash_balance: float = 0.0
    burn_rate: float = 0.0
    runway_months: float = 0.0
    extra: Optional[Dict[str, Any]] = None


class MetricSnapshotRead(MetricSnapshotCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MetricTrend(BaseModel):
    """Single data point for a time-series chart."""
    date: date
    value: float


class MetricSummary(BaseModel):
    """Current values + deltas for dashboard cards."""
    mrr: float
    mrr_delta: float           # Change from previous period
    mrr_delta_pct: float
    arr: float
    total_customers: int
    customer_delta: int
    churn_rate: float
    churn_rate_delta: float
    net_revenue_retention: float
    ltv_cac_ratio: float
    runway_months: float
    burn_rate: float
    as_of_date: date


class MetricTrendResponse(BaseModel):
    metric: str
    period_days: int
    data: List[MetricTrend]
