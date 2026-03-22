# app/db/models/notification.py

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import UUIDBaseModel


class Notification(UUIDBaseModel):
    """In-app notifications for users."""
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(String, nullable=False, index=True)
    # anomaly_alert | metric_milestone | team_invite | payment_failed
    # integration_error | weekly_digest | system | recommendation
    level = Column(String, default="info")              # info | success | warning | critical
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String, nullable=True)
    action_label = Column(String, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    notification_metadata = Column("notifications_metadata", JSON, nullable=True)
    user = relationship("User")

    __table_args__ = (Index("idx_notif_user_unread", "user_id", "is_read"),)


class AlertRule(UUIDBaseModel):
    """Anomaly detection + threshold alert rules per organization."""
    __tablename__ = "alert_rules"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    metric = Column(String, nullable=False)             # mrr | churn_rate | runway_months | ai_cost | etc.
    condition = Column(String, nullable=False)          # above | below | change_pct | anomaly
    threshold = Column(String, nullable=True)           # value or pct depending on condition
    window_hours = Column(String, default="24")         # evaluation window
    severity = Column(String, default="warning")        # info | warning | critical
    channels = Column(JSON, default=list)               # [email, slack, in_app]
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    cooldown_minutes = Column(String, default="60")     # min time between repeated alerts

    organization = relationship("Organization")

    __table_args__ = (Index("idx_alert_org_metric", "organization_id", "metric"),)


class AlertEvent(UUIDBaseModel):
    """Log of every alert that fired."""
    __tablename__ = "alert_events"

    rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String, nullable=False)
    triggered_value = Column(String, nullable=False)
    threshold_value = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    channels_notified = Column(JSON, nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    rule = relationship("AlertRule")
