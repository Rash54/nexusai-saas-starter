# app/api/v1/growth.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.services.growth_service import track_growth_event, get_growth_summary
from app.schemas.growth import GrowthEventCreate, GrowthEventRead, GrowthSummary

router = APIRouter(prefix="/growth", tags=["Growth"])


@router.post("/{org_id}/events", response_model=GrowthEventRead, status_code=201)
async def create_growth_event(
    org_id: UUID,
    data: GrowthEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track a user lifecycle event (signup, activation, churn, etc.)."""
    data.organization_id = org_id
    return await track_growth_event(db, data)


@router.get("/{org_id}/summary", response_model=GrowthSummary)
async def growth_summary(
    org_id: UUID,
    days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Growth summary: signups, activation funnel, channel breakdown, cohort data."""
    return await get_growth_summary(db, org_id, days=days)
