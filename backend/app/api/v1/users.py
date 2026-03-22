# app/api/v1/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_superuser
from app.db.models.user import User
from app.db.models.organization import Organization
from app.db.models.organization_membership import OrganizationMembership
from app.core.security import get_password_hash
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me/organizations")
async def get_my_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all organizations the current user belongs to.
    Returns list with org_id, name, role. Frontend uses this to set orgId after login.
    """
    result = await db.execute(
        select(OrganizationMembership, Organization)
        .join(Organization, OrganizationMembership.organization_id == Organization.id)
        .where(OrganizationMembership.user_id == current_user.id)
        .order_by(OrganizationMembership.created_at)
    )
    rows = result.all()

    return [
        {
            "org_id":   str(org.id),
            "name":     org.name,
            "slug":     org.slug,
            "role":     membership.role,
        }
        for membership, org in rows
    ]


@router.get("/", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """List all users — superuser only."""
    result = await db.execute(select(User))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a user by ID."""
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user profile."""
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_unset=True)
    if "password" in updates:
        updates["password_hash"] = get_password_hash(updates.pop("password"))
    for k, v in updates.items():
        setattr(user, k, v)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Delete a user — superuser only."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
