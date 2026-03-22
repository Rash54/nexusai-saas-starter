# app/api/v1/settings.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.organization import Organization
from app.db.models.team import BrandingSettings, UserPreferences

router = APIRouter(prefix="/settings", tags=["Settings & Preferences"])


class OrgSettingsUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None


class BrandingUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_domain: Optional[str] = None
    dashboard_title: Optional[str] = None
    hide_powered_by: Optional[bool] = None
    custom_css: Optional[str] = None
    font_family: Optional[str] = None
    date_format: Optional[str] = None
    currency_symbol: Optional[str] = None
    timezone: Optional[str] = None


class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    default_org_id: Optional[UUID] = None
    default_period_days: Optional[int] = None
    dashboard_layout: Optional[dict] = None
    pinned_metrics: Optional[list] = None
    email_notifications: Optional[bool] = None
    slack_notifications: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    anomaly_alerts: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    onboarding_completed: Optional[bool] = None


# ── Organization Settings ─────────────────────────────────────────────────────

@router.get("/{org_id}/organization")
async def get_org_settings(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get organization settings."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "description": org.description,
        "website": org.website,
        "industry": org.industry,
        "logo_url": org.logo_url,
        "is_active": org.is_active,
        "created_at": org.created_at,
    }


@router.patch("/{org_id}/organization")
async def update_org_settings(
    org_id: UUID,
    data: OrgSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update organization settings."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    await db.commit()
    return {"status": "updated"}


# ── Branding ──────────────────────────────────────────────────────────────────

@router.get("/{org_id}/branding")
async def get_branding(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get branding/white-label settings."""
    result = await db.execute(
        select(BrandingSettings).where(BrandingSettings.organization_id == org_id)
    )
    branding = result.scalar_one_or_none()
    if not branding:
        # Return defaults
        return {
            "primary_color": "#6366f1",
            "secondary_color": "#8b5cf6",
            "accent_color": "#06b6d4",
            "background_color": "#0f172a",
            "font_family": "Inter",
            "date_format": "MMM D, YYYY",
            "currency_symbol": "$",
            "timezone": "UTC",
            "hide_powered_by": False,
        }

    return {k: v for k, v in vars(branding).items() if not k.startswith("_")}


@router.patch("/{org_id}/branding")
async def update_branding(
    org_id: UUID,
    data: BrandingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update branding/white-label settings."""
    result = await db.execute(
        select(BrandingSettings).where(BrandingSettings.organization_id == org_id)
    )
    branding = result.scalar_one_or_none()

    if not branding:
        branding = BrandingSettings(organization_id=org_id)
        db.add(branding)

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(branding, k, v)

    await db.commit()
    return {"status": "updated"}


# ── User Preferences ──────────────────────────────────────────────────────────

@router.get("/me/preferences")
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's preferences."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        return {
            "theme": "dark",
            "default_period_days": 30,
            "email_notifications": True,
            "weekly_digest": True,
            "anomaly_alerts": True,
            "language": "en",
            "timezone": "UTC",
            "onboarding_completed": False,
        }
    return {k: v for k, v in vars(prefs).items() if not k.startswith("_")}


@router.patch("/me/preferences")
async def update_preferences(
    data: UserPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's preferences."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(prefs, k, v)

    await db.commit()
    return {"status": "updated"}
