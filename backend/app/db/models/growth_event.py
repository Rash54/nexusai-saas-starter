# app/db/models/growth_event.py

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class GrowthEvent(UUIDBaseModel):
    """
    Tracks user lifecycle events: signups, activation, engagement, churn.
    Powers the activation funnel and retention cohort analysis.
    """
    __tablename__ = "growth_events"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Event ─────────────────────────────────────────────────────────────────
    event_type = Column(String, nullable=False, index=True)
    # signup | email_verified | onboarding_complete | first_action
    # feature_used | invite_sent | became_paying | churned | reactivated

    # ── User ─────────────────────────────────────────────────────────────────
    user_id = Column(String, nullable=True, index=True)
    user_email = Column(String, nullable=True)
    acquisition_channel = Column(String, nullable=True)   # organic | paid | referral | direct
    referrer = Column(String, nullable=True)
    country = Column(String, nullable=True)
    plan = Column(String, nullable=True)

    # ── Feature Tracking ──────────────────────────────────────────────────────
    feature_name = Column(String, nullable=True)          # which feature was used
    is_power_user = Column(Boolean, default=False)

    # ── Meta ─────────────────────────────────────────────────────────────────
    session_id = Column(String, nullable=True)
    extra = Column(JSON, nullable=True)

    organization = relationship("Organization", back_populates="growth_events")

    __table_args__ = (
        Index("idx_growth_event_org_created", "organization_id", "created_at"),
        Index("idx_growth_event_type", "event_type"),
        Index("idx_growth_event_user", "user_id"),
    )
