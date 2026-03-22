# app/schemas/recommendation.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID


class RecommendationRead(BaseModel):
    id: UUID
    organization_id: UUID
    category: str
    title: str
    summary: str
    detail: Optional[str] = None
    action_items: Optional[List[str]] = None
    impact_score: float
    urgency_score: float
    confidence: float
    is_dismissed: bool
    is_actioned: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationUpdate(BaseModel):
    is_dismissed: Optional[bool] = None
    is_actioned: Optional[bool] = None


class DashboardSummary(BaseModel):
    """Full dashboard overview — one API call to rule them all."""
    organization_id: UUID
    organization_name: str
    as_of: datetime

    # Key metrics
    mrr: float
    mrr_growth_pct: float
    arr: float
    total_customers: int
    active_customers: int
    churn_rate: float
    net_revenue_retention: float
    ltv_cac_ratio: float
    runway_months: float
    burn_rate: float

    # AI usage
    ai_total_cost_mtd: float
    ai_total_tokens_mtd: int
    ai_requests_mtd: int

    # Growth
    signups_mtd: int
    activation_rate: float
    trial_to_paid_rate: float

    # Insights
    top_recommendations: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]]   # [{level, message, metric}]
