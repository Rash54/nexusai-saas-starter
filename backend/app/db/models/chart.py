# app/db/models/chart.py

from sqlalchemy import Column, String, Boolean, ForeignKey, Index, JSON, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import UUIDBaseModel


class ChartConfig(UUIDBaseModel):
    """Saved chart configurations for custom dashboards."""
    __tablename__ = "chart_configs"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    chart_type = Column(String, nullable=False)
    # line | bar | area | pie | donut | scatter | waterfall | funnel | heatmap | gauge | table
    metric = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)               # multiple metrics on same chart
    period_days = Column(Integer, default=30)
    group_by = Column(String, nullable=True)            # day | week | month
    filters = Column(JSON, nullable=True)
    display_options = Column(JSON, nullable=True)       # colors, labels, axis config
    is_public = Column(Boolean, default=False)          # shareable link
    is_pinned = Column(Boolean, default=False)
    position = Column(JSON, nullable=True)              # {x, y, w, h} for grid layout
    refresh_interval_seconds = Column(Integer, default=300)

    organization = relationship("Organization")

    __table_args__ = (Index("idx_chart_org", "organization_id"),)


class AnalyticsReport(UUIDBaseModel):
    """Scheduled or on-demand analytics reports."""
    __tablename__ = "analytics_reports"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String, nullable=False)
    # mrr_breakdown | growth_cohort | ai_cost_analysis | revenue_forecast
    # churn_analysis | ltv_report | acquisition_funnel | financial_summary
    period_days = Column(Integer, default=30)
    schedule = Column(String, nullable=True)            # none | daily | weekly | monthly
    recipients = Column(JSON, nullable=True)            # list of emails
    last_generated_at = Column(JSON, nullable=True)
    format = Column(String, default="pdf")              # pdf | csv | json
    status = Column(String, default="ready")            # ready | generating | error
    file_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    organization = relationship("Organization")
