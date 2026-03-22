# app/db/models/revenue_event.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class RevenueEvent(UUIDBaseModel):
    """
    Individual revenue events (subscriptions, expansions, churn, refunds).
    Source of truth for MRR calculations and financial reporting.
    """
    __tablename__ = "revenue_events"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Event Type ────────────────────────────────────────────────────────────
    event_type = Column(String, nullable=False, index=True)
    # new_subscription | upgrade | downgrade | churn | reactivation
    # one_time | refund | trial_started | trial_converted

    # ── Customer ─────────────────────────────────────────────────────────────
    customer_id = Column(String, nullable=True, index=True)   # External customer ID
    customer_email = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    plan_interval = Column(String, nullable=True)             # month | year

    # ── Amounts ───────────────────────────────────────────────────────────────
    amount = Column(Float, default=0.0)                       # Total amount
    mrr_impact = Column(Float, default=0.0)                   # MRR delta (+/-)
    currency = Column(String, default="USD")

    # ── Source ────────────────────────────────────────────────────────────────
    source = Column(String, nullable=True)                    # stripe | manual | csv
    external_id = Column(String, nullable=True, index=True)   # Stripe event ID
    extra = Column(JSON, nullable=True)

    organization = relationship("Organization", back_populates="revenue_events")

    __table_args__ = (
        Index("idx_rev_event_org_created", "organization_id", "created_at"),
        Index("idx_rev_event_type", "event_type"),
        Index("idx_rev_event_customer", "customer_id"),
    )
