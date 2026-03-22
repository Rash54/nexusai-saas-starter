# app/crud/user.py — Fixed: points to correct model path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.models.user import User
from app.core.security import get_password_hash, verify_password as _verify


async def get_user(db: AsyncSession, user_id: UUID):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_users(db: AsyncSession):
    result = await db.execute(select(User))
    return result.scalars().all()


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user):
    db_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        full_name=getattr(user, "full_name", None),
        is_active=True,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(db: AsyncSession, db_user: User, updates: dict):
    if "password" in updates:
        updates["password_hash"] = get_password_hash(updates.pop("password"))
    for key, value in updates.items():
        setattr(db_user, key, value)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def delete_user(db: AsyncSession, db_user: User):
    await db.delete(db_user)
    await db.commit()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _verify(plain_password, hashed_password)
