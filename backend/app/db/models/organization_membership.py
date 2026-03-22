# app/db/models/organization_membership.py

from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class OrganizationMembership(UUIDBaseModel):
    __tablename__ = "organization_memberships"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String, nullable=False, default="member")
    # roles: owner | admin | member | viewer

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_organization"),
    )
