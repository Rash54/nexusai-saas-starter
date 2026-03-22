# app/api/v1/dashboard.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.services.dashboard_service import get_dashboard_summary
from app.schemas.recommendation import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{org_id}", response_model=DashboardSummary)
async def dashboard_summary(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Master dashboard endpoint — returns all KPIs, AI usage, growth metrics,
    top recommendations, and alerts in a single call.
    """
    return await get_dashboard_summary(db, org_id)
