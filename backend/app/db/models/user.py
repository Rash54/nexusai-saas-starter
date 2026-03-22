# app/db/models/user.py

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class User(UUIDBaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    memberships = relationship(
        "OrganizationMembership",
        back_populates="user",
        cascade="all, delete-orphan",
    )
