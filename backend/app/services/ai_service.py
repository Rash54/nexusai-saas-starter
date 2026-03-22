# app/services/ai_service.py — Community Edition stub
# Full AI usage tracking available in NexusAI Pro
# https://yusuf545.gumroad.com/l/ttazrg

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession


async def get_ai_usage_summary(db: AsyncSession, org_id: UUID, days: int = 30) -> object:
    """Stub — returns zeroed AI usage. Full tracking available in Pro."""
    class _Summary:
        total_requests = 0
        total_tokens = 0
        total_cost_usd = 0.0
        avg_latency_ms = 0.0
        error_rate = 0.0
        cost_by_model = {}
        cost_by_feature = {}
        tokens_by_day = []
        top_models = []
        top_features = []
        period_days = days
    return _Summary()


async def log_ai_usage(db: AsyncSession, data: object) -> None:
    """Stub — AI usage logging available in Pro."""
    pass


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> dict:
    return {"input_cost_usd": 0.0, "output_cost_usd": 0.0, "total_cost_usd": 0.0}
