# app/services/auth_service.py

import re
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.db.models.user import User
from app.db.models.organization import Organization
from app.db.models.organization_membership import OrganizationMembership
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.logging import logger
from app.services import notification_service as notif
from app.schemas.user import UserCreate


def _make_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "my-org"


async def register_user(db: AsyncSession, data: UserCreate) -> User:
    # Check email not already taken
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create user
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Auto-create personal organization
    org_name = f"{data.full_name or data.email.split('@')[0]}'s Workspace"
    base_slug = _make_slug(data.full_name or data.email.split("@")[0])
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Organization).where(Organization.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(name=org_name, slug=slug, is_active=True)
    db.add(org)
    await db.flush()

    # Make user the owner
    membership = OrganizationMembership(
        user_id=user.id,
        organization_id=org.id,
        role="owner",
    )
    db.add(membership)

    await db.commit()

    # Welcome notification via service
    await notif.notify_welcome(db, user_id=user.id, org_id=org.id, org_name=org_name)
    await db.refresh(user)

    # Send welcome email (non-blocking — don't fail registration if email fails)
    try:
        from app.services.email_service import send_welcome_email
        await send_welcome_email(
            to_email=user.email,
            full_name=data.full_name or "there",
            org_name=org_name,
        )
    except Exception as e:
        logger.warning(f"Welcome email failed for {user.email}: {e}")

    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    now = datetime.now(timezone.utc)
    user.last_login_at = now

    # Get user's org
    mem_result = await db.execute(
        select(OrganizationMembership).where(OrganizationMembership.user_id == user.id)
    )
    membership = mem_result.scalars().first()
    org_id = membership.organization_id if membership else None

    await db.commit()

    # Login notification via service
    await notif.notify_login(db, user_id=user.id, org_id=org_id)

    return user


def generate_tokens(user: User) -> dict:
    payload = {"sub": str(user.id), "email": user.email}
    return {
        "access_token": create_access_token(payload),
        "refresh_token": create_refresh_token(payload),
        "token_type": "bearer",
    }
