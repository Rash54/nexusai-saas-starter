# app/api/v1/recommendations.py — Community Edition (static stub)
# Full AI-powered recommendations available in NexusAI Pro
# https://yusuf545.gumroad.com/l/ttazrg

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.db.models.user import User

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

SAMPLE_RECOMMENDATIONS = [
    {
        "id": "rec-001",
        "title": "Reduce churn with proactive outreach",
        "description": "Identify customers at risk of churning by monitoring usage drops over 14 days and trigger an automated email sequence.",
        "category": "retention",
        "priority": "high",
        "estimated_impact": "+8% NRR",
        "pro_locked": False,
    },
    {
        "id": "rec-002",
        "title": "Expand revenue from your top 20% of customers",
        "description": "Your highest-value accounts show strong engagement signals. A targeted upsell campaign could increase ARPU by 15-20%.",
        "category": "expansion",
        "priority": "high",
        "estimated_impact": "+15% ARPU",
        "pro_locked": False,
    },
    {
        "id": "rec-003",
        "title": "AI-powered anomaly alerts",
        "description": "Get instant alerts when MRR, churn, or burn rate deviates from your historical baseline.",
        "category": "monitoring",
        "priority": "medium",
        "estimated_impact": "Real-time awareness",
        "pro_locked": True,
        "upgrade_url": "https://yusuf545.gumroad.com/l/ttazrg",
    },
    {
        "id": "rec-004",
        "title": "What-if scenario modelling",
        "description": "Simulate the impact of reducing churn by 2%, raising prices by 10%, or cutting CAC — projected over 12 months.",
        "category": "planning",
        "priority": "medium",
        "estimated_impact": "Strategic clarity",
        "pro_locked": True,
        "upgrade_url": "https://yusuf545.gumroad.com/l/ttazrg",
    },
]


@router.get("")
async def list_recommendations(current_user: User = Depends(get_current_user)):
    """
    Returns sample AI recommendations.
    Upgrade to Pro for real AI-generated recommendations based on your live data.
    """
    return {
        "recommendations": SAMPLE_RECOMMENDATIONS,
        "total": len(SAMPLE_RECOMMENDATIONS),
        "pro_note": "Upgrade to NexusAI Pro to unlock AI-generated recommendations from your live data.",
        "upgrade_url": "https://yusuf545.gumroad.com/l/ttazrg",
    }
