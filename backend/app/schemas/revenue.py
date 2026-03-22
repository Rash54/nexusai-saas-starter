# app/schemas/revenue.py

from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Dict
from uuid import UUID


class RevenueEventCreate(BaseModel):
    organization_id: UUID
    event_type: str
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None
    plan_interval: Optional[str] = None
    amount: float = 0.0
    mrr_impact: float = 0.0
    currency: str = "USD"
    source: Optional[str] = None
    external_id: Optional[str] = None
    extra: Optional[Dict] = None


class RevenueEventRead(RevenueEventCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class RevenueSummary(BaseModel):
    """Revenue breakdown for financial dashboard."""
    mrr: float
    arr: float
    new_mrr: float
    expansion_mrr: float
    contraction_mrr: float
    churned_mrr: float
    net_new_mrr: float
    mrr_by_plan: Dict[str, float]
    mrr_movement_waterfall: List[Dict]   # [{label, value, type}]
    revenue_by_day: List[Dict]           # [{date, mrr, new_mrr, churned_mrr}]
    period_days: int


# ── Forecast ──────────────────────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    date: date
    predicted_value: float
    lower_bound: float
    upper_bound: float
    is_actual: bool = False


class ForecastResponse(BaseModel):
    metric: str
    model: str                    # linear | exponential | arima
    confidence: float
    data: List[ForecastPoint]
    summary: Dict                 # {projected_eom_mrr, growth_rate, etc.}


class RunwayScenario(BaseModel):
    scenario: str                 # base | optimistic | pessimistic
    burn_rate: float
    cash_balance: float
    runway_months: float
    break_even_date: Optional[str] = None


class RunwayResponse(BaseModel):
    current_cash: float
    current_burn: float
    current_runway_months: float
    scenarios: List[RunwayScenario]
    monthly_projection: List[Dict]   # [{month, cash, mrr, burn}]
