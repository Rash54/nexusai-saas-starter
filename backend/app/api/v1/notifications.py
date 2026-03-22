# app/api/v1/notifications.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import asyncio

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.notification import Notification, AlertRule

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


class AlertRuleCreate(BaseModel):
    name: str
    metric: str
    condition: str          # above | below | change_pct | anomaly
    threshold: Optional[str] = None
    window_hours: str = "24"
    severity: str = "warning"
    channels: list = ["in_app"]
    cooldown_minutes: str = "60"


# Notifications

@router.get("/")
async def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current user."""

    # FIX: run both queries in parallel instead of sequentially
    notif_query = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
    )
    if unread_only:
        notif_query = notif_query.where(Notification.is_read == False)
    notif_query = notif_query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)

    # FIX: use func.count() - a single integer DB query instead of loading all rows into memory
    count_query = (
        select(func.count(Notification.id))
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )

    notif_result, count_result = await asyncio.gather(
        db.execute(notif_query),
        db.execute(count_query),
    )

    notifications = notif_result.scalars().all()
    unread_count = count_result.scalar() or 0

    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id":           str(n.id),
                "type":         n.type,
                "level":        n.level,
                "title":        n.title,
                "message":      n.message,
                "action_url":   n.action_url,
                "action_label": n.action_label,
                "is_read":      n.is_read,
                "created_at":   n.created_at,
                "metadata":     n.notification_metadata,
            }
            for n in notifications
        ],
    }


@router.post("/{notification_id}/read", status_code=200)
async def mark_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"status": "ok"}


@router.post("/read-all", status_code=200)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"status": "ok"}


# Alert Rules

@router.get("/{org_id}/alerts/rules")
async def list_alert_rules(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all alert rules for an organization."""
    result = await db.execute(
        select(AlertRule).where(AlertRule.organization_id == org_id)
    )
    rules = result.scalars().all()
    return [
        {
            "id":                str(r.id),
            "name":              r.name,
            "metric":            r.metric,
            "condition":         r.condition,
            "threshold":         r.threshold,
            "severity":          r.severity,
            "channels":          r.channels,
            "is_active":         r.is_active,
            "last_triggered_at": r.last_triggered_at,
        }
        for r in rules
    ]


@router.post("/{org_id}/alerts/rules", status_code=201)
async def create_alert_rule(
    org_id: UUID,
    data: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a custom alert rule."""
    rule = AlertRule(
        organization_id=org_id,
        created_by=current_user.id,
        **data.model_dump(),
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {"id": str(rule.id), "name": rule.name}


@router.delete("/{org_id}/alerts/rules/{rule_id}", status_code=204)
async def delete_alert_rule(
    org_id: UUID,
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    await db.delete(rule)
    await db.commit()


@router.post("/{org_id}/anomaly-scan")
async def run_anomaly_scan(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger anomaly detection scan for an organization."""
    # Anomaly detection is available in NexusAI Pro
    return {
        "pro_feature": True,
        "message": "Anomaly detection is available in NexusAI Pro.",
        "upgrade_url": "https://yusuf545.gumroad.com/l/ttazrg",
    }