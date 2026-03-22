# app/api/v1/team.py

import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
from pydantic import BaseModel, EmailStr

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.organization import Organization
from app.db.models.organization_membership import OrganizationMembership
from app.db.models.team import TeamInvite
from app.services import notification_service as notif

router = APIRouter(prefix="/team", tags=["Team & Collaboration"])

VALID_ROLES = ["owner", "admin", "member", "viewer"]


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"
    message: str = None


class RoleUpdate(BaseModel):
    role: str


# ── Team Members ──────────────────────────────────────────────────────────────

@router.get("/{org_id}/members")
async def list_members(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all team members for an organization."""
    result = await db.execute(
        select(OrganizationMembership, User)
        .join(User, OrganizationMembership.user_id == User.id)
        .where(OrganizationMembership.organization_id == org_id)
    )
    rows = result.all()
    return [
        {
            "membership_id": str(m.id),
            "user_id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "role": m.role,
            "joined_at": m.created_at,
            "last_login_at": u.last_login_at,
        }
        for m, u in rows
    ]


@router.patch("/{org_id}/members/{user_id}/role")
async def update_member_role(
    org_id: UUID,
    user_id: UUID,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a team member's role."""
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {VALID_ROLES}")

    result = await db.execute(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == org_id,
            OrganizationMembership.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    old_role = membership.role
    membership.role = data.role
    await db.commit()

    # Notify the member whose role changed
    await notif.notify_member_role_changed(
        db, user_id=user_id, org_id=org_id,
        new_role=data.role,
        changed_by_name=current_user.full_name or current_user.email,
    )
    return {"user_id": str(user_id), "new_role": data.role}


@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(
    org_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a team member from the organization."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    result = await db.execute(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == org_id,
            OrganizationMembership.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(membership)
    await db.commit()

    # Fetch org name for notification
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    await notif.notify_member_removed(
        db, user_id=user_id, org_id=org_id,
        org_name=org.name if org else "the workspace",
    )


# ── Invites ───────────────────────────────────────────────────────────────────

@router.post("/{org_id}/invite", status_code=201)
async def send_invite(
    org_id: UUID,
    data: InviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a team invitation email."""
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {VALID_ROLES}")

    token = secrets.token_urlsafe(32)
    invite = TeamInvite(
        organization_id=org_id,
        invited_by=current_user.id,
        email=data.email,
        role=data.role,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        message=data.message,
    )
    db.add(invite)
    await db.commit()

    invite_url = f"/invite/accept?token={token}"

    # Send invite email
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    from app.services.email_service import send_team_invite
    await send_team_invite(
        to_email=data.email,
        inviter_name=current_user.full_name or current_user.email,
        org_name=org.name if org else "Your Team",
        role=data.role,
        invite_url=invite_url,
        message=data.message,
    )

    # Notify the inviter
    await notif.notify_invite_sent(db, current_user.id, org_id, data.email)

    return {
        "invite_id": str(invite.id),
        "email": data.email,
        "role": data.role,
        "invite_url": invite_url,
        "expires_at": invite.expires_at,
    }


@router.get("/{org_id}/invites")
async def list_invites(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending invites for an organization."""
    result = await db.execute(
        select(TeamInvite).where(
            TeamInvite.organization_id == org_id,
            TeamInvite.is_accepted == False,
        )
    )
    invites = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "email": i.email,
            "role": i.role,
            "expires_at": i.expires_at,
            "created_at": i.created_at,
        }
        for i in invites
    ]


@router.post("/invite/accept")
async def accept_invite(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a team invite by token."""
    result = await db.execute(
        select(TeamInvite).where(
            TeamInvite.token == token,
            TeamInvite.is_accepted == False,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite token")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired")

    # Check if user is already a member of this org
    existing = await db.execute(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == invite.organization_id,
        )
    )
    if existing.scalar_one_or_none():
        # Already a member — just mark invite as accepted and return
        invite.is_accepted = True
        invite.accepted_at = datetime.now(timezone.utc)
        await db.commit()
        return {
            "status": "already_member",
            "organization_id": str(invite.organization_id),
            "role": invite.role,
        }

    # Add membership
    membership = OrganizationMembership(
        user_id=current_user.id,
        organization_id=invite.organization_id,
        role=invite.role,
    )
    db.add(membership)
    invite.is_accepted = True
    invite.accepted_at = datetime.now(timezone.utc)
    await db.commit()

    # Notify org members that someone joined
    await notif.notify_invite_accepted(
        db,
        org_id=invite.organization_id,
        new_member_name=current_user.full_name,
        new_member_id=current_user.id,
        new_member_email=current_user.email,
    )

    return {
        "status": "accepted",
        "organization_id": str(invite.organization_id),
        "role": invite.role,
    }


@router.delete("/{org_id}/invites/{invite_id}", status_code=204)
async def revoke_invite(
    org_id: UUID,
    invite_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke a pending invite."""
    result = await db.execute(select(TeamInvite).where(TeamInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    await db.delete(invite)
    await db.commit()