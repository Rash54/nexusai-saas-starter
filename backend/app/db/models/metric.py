# app/db/models/metric.py

from sqlalchemy import Column, String, Float, Integer, Date, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class MetricSnapshot(UUIDBaseModel):
    """
    Daily snapshot of key SaaS metrics for an organization.
    One row per org per date — used to power all charts and trends.
    """
    __tablename__ = "metric_snapshots"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    snapshot_date = Column(Date, nullable=False, index=True)

    # ── Revenue Metrics ───────────────────────────────────────────────────────
    mrr = Column(Float, default=0.0)               # Monthly Recurring Revenue
    arr = Column(Float, default=0.0)               # Annual Recurring Revenue
    new_mrr = Column(Float, default=0.0)           # New MRR this period
    expansion_mrr = Column(Float, default=0.0)     # Expansion from upgrades
    contraction_mrr = Column(Float, default=0.0)   # Downgrade MRR
    churned_mrr = Column(Float, default=0.0)       # Lost MRR
    net_new_mrr = Column(Float, default=0.0)       # Net MRR movement

    # ── Customer Metrics ─────────────────────────────────────────────────────
    total_customers = Column(Integer, default=0)
    new_customers = Column(Integer, default=0)
    churned_customers = Column(Integer, default=0)
    active_customers = Column(Integer, default=0)

    # ── Churn & Retention ────────────────────────────────────────────────────
    churn_rate = Column(Float, default=0.0)        # % customers churned
    revenue_churn_rate = Column(Float, default=0.0)
    net_revenue_retention = Column(Float, default=0.0)  # NRR %
    gross_revenue_retention = Column(Float, default=0.0)

    # ── Unit Economics ────────────────────────────────────────────────────────
    arpu = Column(Float, default=0.0)              # Avg Revenue Per User
    ltv = Column(Float, default=0.0)               # Customer Lifetime Value
    cac = Column(Float, default=0.0)               # Customer Acquisition Cost
    ltv_cac_ratio = Column(Float, default=0.0)     # LTV:CAC ratio

    # ── Growth ────────────────────────────────────────────────────────────────
    mrr_growth_rate = Column(Float, default=0.0)   # MoM MRR growth %
    customer_growth_rate = Column(Float, default=0.0)

    # ── Cash ─────────────────────────────────────────────────────────────────
    cash_balance = Column(Float, default=0.0)
    burn_rate = Column(Float, default=0.0)         # Monthly burn
    runway_months = Column(Float, default=0.0)     # Months of runway

    # Flexible extras
    extra = Column(JSON, nullable=True)

    organization = relationship("Organization", back_populates="metrics")

    __table_args__ = (
        Index("idx_metric_org_date", "organization_id", "snapshot_date"),
    )
