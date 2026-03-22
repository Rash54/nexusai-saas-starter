# app/db/models/organization.py

from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class Organization(UUIDBaseModel):
    __tablename__ = "organizations"

    name        = Column(String, nullable=False)
    slug        = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    website     = Column(String, nullable=True)
    logo_url    = Column(String, nullable=True)
    industry    = Column(String, nullable=True)
    is_active   = Column(Boolean, default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    memberships = relationship(
        "OrganizationMembership",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    metrics = relationship(
        "MetricSnapshot",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    revenue_events = relationship(
        "RevenueEvent",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    growth_events = relationship(
        "GrowthEvent",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    tasks = relationship(
        "Task",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    # NOTE: ai_usage_logs relationship removed — AIUsageLog is a Pro Edition model.
    # NOTE: payments/subscriptions relationships removed — Pro Edition only.
