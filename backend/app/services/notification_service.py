# app/services/notification_service.py
# Centralized notification service — every part of the system calls this.
# Never scatter notification logic across routers.

from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.notification import Notification
from app.db.models.organization_membership import OrganizationMembership
from app.core.logging import logger


# ---------------------------------------------------------------------------
# Core helper — everything goes through here
# ---------------------------------------------------------------------------

async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    message: str,
    type: str,
    level: str = "info",
    org_id: Optional[UUID] = None,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        organization_id=org_id,
        type=type,
        level=level,
        title=title,
        message=message,
        action_url=action_url,
        action_label=action_label,
        notification_metadata=metadata,
    )
    db.add(notif)
    await db.flush()
    return notif


async def notify_all_org_members(
    db: AsyncSession,
    org_id: UUID,
    title: str,
    message: str,
    type: str,
    level: str = "info",
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[dict] = None,
    exclude_user_id: Optional[UUID] = None,
):
    """Send a notification to every member of an org."""
    result = await db.execute(
        select(OrganizationMembership).where(OrganizationMembership.organization_id == org_id)
    )
    memberships = result.scalars().all()
    for m in memberships:
        if exclude_user_id and m.user_id == exclude_user_id:
            continue
        await create_notification(
            db, m.user_id, title, message, type, level,
            org_id=org_id, action_url=action_url, action_label=action_label,
            metadata=metadata,
        )
    await db.commit()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def notify_login(db: AsyncSession, user_id: UUID, org_id: Optional[UUID] = None):
    now = datetime.now(timezone.utc)
    await create_notification(
        db, user_id,
        title="New login detected",
        message=f"You logged in on {now.strftime('%B %d, %Y at %H:%M')} UTC.",
        type="system", level="info", org_id=org_id,
        metadata={"login_at": now.isoformat()},
    )
    await db.commit()


async def notify_welcome(db: AsyncSession, user_id: UUID, org_id: UUID, org_name: str):
    await create_notification(
        db, user_id,
        title="Welcome to NEXU! 🎉",
        message=f"Your workspace '{org_name}' is ready. Upload your first data file to get AI-powered insights.",
        type="system", level="success", org_id=org_id,
        action_url="/upload", action_label="Upload Data",
    )
    await db.commit()


async def notify_password_changed(db: AsyncSession, user_id: UUID, org_id: Optional[UUID] = None):
    await create_notification(
        db, user_id,
        title="Password changed",
        message=f"Your password was changed on {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M')} UTC. If this wasn't you, contact support immediately.",
        type="system", level="warning", org_id=org_id,
        action_url="/settings", action_label="Review Settings",
    )
    await db.commit()


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

async def notify_task_assigned(
    db: AsyncSession,
    assignee_id: UUID,
    assigner_name: str,
    task_title: str,
    task_id: str,
    org_id: UUID,
    due_date: Optional[str] = None,
):
    due_text = f" Due: {due_date}." if due_date else ""
    await create_notification(
        db, assignee_id,
        title="Task assigned to you",
        message=f"{assigner_name} assigned you: \"{task_title}\".{due_text}",
        type="system", level="info", org_id=org_id,
        action_url=f"/tasks?highlight={task_id}", action_label="View Task",
        metadata={"task_id": task_id},
    )
    await db.commit()


async def notify_task_due_soon(
    db: AsyncSession,
    user_id: UUID,
    task_title: str,
    task_id: str,
    org_id: UUID,
    hours_until_due: int,
):
    await create_notification(
        db, user_id,
        title=f"Task due in {hours_until_due}h",
        message=f"\"{task_title}\" is due in {hours_until_due} hours.",
        type="system", level="warning", org_id=org_id,
        action_url=f"/tasks?highlight={task_id}", action_label="View Task",
        metadata={"task_id": task_id, "hours_until_due": hours_until_due},
    )
    await db.commit()


async def notify_task_overdue(
    db: AsyncSession,
    user_id: UUID,
    task_title: str,
    task_id: str,
    org_id: UUID,
):
    await create_notification(
        db, user_id,
        title="Task overdue",
        message=f"\"{task_title}\" is overdue. Please update its status.",
        type="system", level="critical", org_id=org_id,
        action_url=f"/tasks?highlight={task_id}", action_label="View Task",
        metadata={"task_id": task_id},
    )
    await db.commit()


async def notify_task_completed(
    db: AsyncSession,
    org_id: UUID,
    completer_name: str,
    task_title: str,
    task_id: str,
    exclude_user_id: Optional[UUID] = None,
):
    await notify_all_org_members(
        db, org_id,
        title="Task completed",
        message=f"{completer_name} completed: \"{task_title}\".",
        type="system", level="success",
        action_url="/tasks", action_label="View Tasks",
        metadata={"task_id": task_id},
        exclude_user_id=exclude_user_id,
    )


# ---------------------------------------------------------------------------
# Payments & Billing
# ---------------------------------------------------------------------------

async def notify_payment_received(
    db: AsyncSession,
    org_id: UUID,
    amount: float,
    currency: str,
    plan_name: str,
):
    await notify_all_org_members(
        db, org_id,
        title="Payment received ✅",
        message=f"Payment of {currency} {amount:.2f} for {plan_name} was processed successfully.",
        type="system", level="success",
        action_url="/billing", action_label="View Billing",
        metadata={"amount": amount, "currency": currency, "plan": plan_name},
    )


async def notify_payment_failed(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    amount: float,
    currency: str,
):
    await create_notification(
        db, user_id,
        title="Payment failed ⚠️",
        message=f"We couldn't process your payment of {currency} {amount:.2f}. Please update your payment method.",
        type="system", level="critical", org_id=org_id,
        action_url="/billing", action_label="Update Payment Method",
        metadata={"amount": amount, "currency": currency},
    )
    await db.commit()


async def notify_subscription_cancelled(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    plan_name: str,
    end_date: str,
):
    await create_notification(
        db, user_id,
        title="Subscription cancelled",
        message=f"Your {plan_name} subscription will end on {end_date}. You can resubscribe any time.",
        type="system", level="warning", org_id=org_id,
        action_url="/billing", action_label="Manage Subscription",
    )
    await db.commit()


async def notify_subscription_renewed(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    plan_name: str,
    next_date: str,
    amount: float,
    currency: str,
):
    await create_notification(
        db, user_id,
        title="Subscription renewed ✅",
        message=f"Your {plan_name} plan renewed successfully. Next billing date: {next_date}.",
        type="system", level="success", org_id=org_id,
        action_url="/billing", action_label="View Billing",
        metadata={"amount": amount, "currency": currency},
    )
    await db.commit()


async def notify_trial_ending(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    days_left: int,
):
    await create_notification(
        db, user_id,
        title=f"Trial ending in {days_left} day{'s' if days_left != 1 else ''}",
        message=f"Your free trial ends in {days_left} day{'s' if days_left != 1 else ''}. Upgrade to keep full access.",
        type="system", level="warning", org_id=org_id,
        action_url="/billing", action_label="Upgrade Now",
        metadata={"days_left": days_left},
    )
    await db.commit()


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------

async def notify_invite_sent(
    db: AsyncSession,
    inviter_id: UUID,
    org_id: UUID,
    invited_email: str,
):
    await create_notification(
        db, inviter_id,
        title="Invite sent",
        message=f"An invite was sent to {invited_email}. They have 7 days to accept.",
        type="system", level="info", org_id=org_id,
        action_url="/team", action_label="View Team",
    )
    await db.commit()


async def notify_invite_accepted(
    db: AsyncSession,
    org_id: UUID,
    new_member_name: str,
    new_member_id: UUID,
    new_member_email: str,
):
    # Notify all existing org members
    await notify_all_org_members(
        db, org_id,
        title="New team member joined 🎉",
        message=f"{new_member_name or new_member_email} joined your workspace.",
        type="system", level="success",
        action_url="/team", action_label="View Team",
        exclude_user_id=new_member_id,
    )
    # Welcome notification for the new member
    await create_notification(
        db, new_member_id,
        title="You joined a workspace!",
        message=f"You've successfully joined the workspace. Explore your dashboard to get started.",
        type="system", level="success", org_id=org_id,
        action_url="/dashboard", action_label="Go to Dashboard",
    )
    await db.commit()


async def notify_member_role_changed(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    new_role: str,
    changed_by_name: str,
):
    await create_notification(
        db, user_id,
        title="Your role was updated",
        message=f"{changed_by_name} changed your role to {new_role}.",
        type="system", level="info", org_id=org_id,
        action_url="/team", action_label="View Team",
    )
    await db.commit()


async def notify_member_removed(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    org_name: str,
):
    await create_notification(
        db, user_id,
        title="Removed from workspace",
        message=f"You were removed from the workspace '{org_name}'.",
        type="system", level="warning", org_id=org_id,
    )
    await db.commit()


# ---------------------------------------------------------------------------
# AI & Data
# ---------------------------------------------------------------------------

async def notify_upload_complete(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    filename: str,
    upload_id: str,
    row_count: int,
    has_ai_insights: bool,
):
    msg = f"\"{filename}\" was processed — {row_count:,} rows."
    if has_ai_insights:
        msg += " AI insights are ready."
    await create_notification(
        db, user_id,
        title="Upload complete ✅",
        message=msg,
        type="system", level="success", org_id=org_id,
        action_url=f"/upload", action_label="View Insights",
        metadata={"upload_id": upload_id, "row_count": row_count},
    )
    await db.commit()


async def notify_upload_failed(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    filename: str,
    error: str,
):
    await create_notification(
        db, user_id,
        title="Upload failed",
        message=f"\"{filename}\" could not be processed: {error[:120]}",
        type="system", level="critical", org_id=org_id,
        action_url="/upload", action_label="Try Again",
    )
    await db.commit()


async def notify_ai_recommendation(
    db: AsyncSession,
    org_id: UUID,
    recommendation_title: str,
    recommendation_id: str,
    priority: str = "medium",
):
    level = "warning" if priority == "high" else "info"
    await notify_all_org_members(
        db, org_id,
        title="New AI recommendation",
        message=f"NEXU AI has a new insight: \"{recommendation_title}\"",
        type="recommendation", level=level,
        action_url="/dashboard", action_label="View Recommendation",
        metadata={"recommendation_id": recommendation_id, "priority": priority},
    )


async def notify_anomaly_detected(
    db: AsyncSession,
    org_id: UUID,
    metric: str,
    message: str,
    severity: str = "warning",
):
    level = "critical" if severity == "critical" else "warning"
    await notify_all_org_members(
        db, org_id,
        title=f"{'🚨 Critical' if severity == 'critical' else '⚠️ Warning'}: {metric.replace('_', ' ').title()} anomaly",
        message=message,
        type="anomaly_alert", level=level,
        action_url="/dashboard", action_label="View Dashboard",
        metadata={"metric": metric, "severity": severity},
    )


async def notify_data_spike(
    db: AsyncSession,
    org_id: UUID,
    metric: str,
    direction: str,
    change_pct: float,
):
    emoji = "📈" if direction == "up" else "📉"
    level = "success" if direction == "up" else "warning"
    await notify_all_org_members(
        db, org_id,
        title=f"{emoji} {metric.replace('_', ' ').title()} spike detected",
        message=f"{metric.replace('_', ' ').title()} moved {direction} by {change_pct:.1f}% — check your dashboard for details.",
        type="anomaly_alert", level=level,
        action_url="/analytics", action_label="View Analytics",
        metadata={"metric": metric, "direction": direction, "change_pct": change_pct},
    )


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------

async def notify_integration_connected(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    provider_name: str,
):
    await create_notification(
        db, user_id,
        title=f"{provider_name} connected ✅",
        message=f"Your {provider_name} integration is active. Data will sync automatically.",
        type="system", level="success", org_id=org_id,
        action_url="/integrations", action_label="View Integrations",
    )
    await db.commit()


async def notify_integration_failed(
    db: AsyncSession,
    org_id: UUID,
    provider_name: str,
    error: str,
):
    await notify_all_org_members(
        db, org_id,
        title=f"{provider_name} sync failed",
        message=f"Could not sync {provider_name}: {error[:100]}. Please reconnect.",
        type="system", level="critical",
        action_url="/integrations", action_label="Fix Integration",
        metadata={"provider": provider_name, "error": error},
    )


async def notify_integration_disconnected(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    provider_name: str,
):
    await create_notification(
        db, user_id,
        title=f"{provider_name} disconnected",
        message=f"Your {provider_name} integration was disconnected. Data will no longer sync.",
        type="system", level="warning", org_id=org_id,
        action_url="/integrations", action_label="Reconnect",
    )
    await db.commit()


# ---------------------------------------------------------------------------
# Support
# ---------------------------------------------------------------------------

async def notify_ticket_created(
    db: AsyncSession,
    user_id: UUID,
    ticket_id: str,
    subject: str,
    org_id: Optional[UUID] = None,
):
    await create_notification(
        db, user_id,
        title="Support ticket created",
        message=f"Your ticket \"{subject}\" was received. We'll respond within 24 hours.",
        type="system", level="info", org_id=org_id,
        action_url="/support", action_label="View Ticket",
        metadata={"ticket_id": ticket_id},
    )
    await db.commit()
