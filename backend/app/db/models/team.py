# app/db/models/team.py

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, JSON, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import UUIDBaseModel


class TeamInvite(UUIDBaseModel):
    """Pending team invitations."""
    __tablename__ = "team_invites"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    role = Column(String, default="member")             # owner | admin | member | viewer
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    is_accepted = Column(Boolean, default=False)
    message = Column(Text, nullable=True)

    organization = relationship("Organization")
    inviter = relationship("User")


class AuditLog(UUIDBaseModel):
    """Immutable audit trail of all significant actions."""
    __tablename__ = "audit_logs"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    # user.login | user.logout | org.settings_updated | member.invited
    # integration.connected | payment.method_added | alert.created | data.exported
    resource_type = Column(String, nullable=True)       # user | organization | integration | payment
    resource_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    changes = Column(JSON, nullable=True)               # {before: {}, after: {}}
    team_metadata = Column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_audit_org_created", "organization_id", "created_at"),
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_action", "action"),
    )


class BrandingSettings(UUIDBaseModel):
    """White-label / branding customization per organization."""
    __tablename__ = "branding_settings"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True)
    primary_color = Column(String, default="#6366f1")
    secondary_color = Column(String, default="#8b5cf6")
    accent_color = Column(String, default="#06b6d4")
    background_color = Column(String, default="#0f172a")
    logo_url = Column(String, nullable=True)
    favicon_url = Column(String, nullable=True)
    custom_domain = Column(String, nullable=True, index=True)
    dashboard_title = Column(String, nullable=True)
    email_from_name = Column(String, nullable=True)
    email_logo_url = Column(String, nullable=True)
    hide_powered_by = Column(Boolean, default=False)    # premium feature
    custom_css = Column(Text, nullable=True)
    font_family = Column(String, default="Inter")
    date_format = Column(String, default="MMM D, YYYY")
    currency_symbol = Column(String, default="$")
    timezone = Column(String, default="UTC")

    organization = relationship("Organization", uselist=False)


class UserPreferences(UUIDBaseModel):
    """Per-user dashboard preferences."""
    __tablename__ = "user_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    theme = Column(String, default="dark")              # dark | light | system
    default_org_id = Column(UUID(as_uuid=True), nullable=True)
    default_period_days = Column(Integer, default=30)
    dashboard_layout = Column(JSON, nullable=True)      # widget positions/sizes
    pinned_metrics = Column(JSON, nullable=True)        # list of metric keys
    email_notifications = Column(Boolean, default=True)
    slack_notifications = Column(Boolean, default=False)
    weekly_digest = Column(Boolean, default=True)
    anomaly_alerts = Column(Boolean, default=True)
    language = Column(String, default="en")
    timezone = Column(String, default="UTC")
    onboarding_completed = Column(Boolean, default=False)

    user = relationship("User", uselist=False)


class SupportTicket(UUIDBaseModel):
    """In-app support tickets."""
    __tablename__ = "support_tickets"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=True)            # billing | technical | feature_request | other
    priority = Column(String, default="normal")         # low | normal | high | urgent
    status = Column(String, default="open")             # open | in_progress | resolved | closed
    assigned_to = Column(UUID(as_uuid=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    attachments = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)

    __table_args__ = (Index("idx_ticket_status", "status"),)


class PerformanceMetric(UUIDBaseModel):
    """API performance and system health monitoring."""
    __tablename__ = "performance_metrics"

    endpoint = Column(String, nullable=False, index=True)
    method = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    __table_args__ = (
        Index("idx_perf_endpoint", "endpoint"),
        Index("idx_perf_created", "created_at"),
    )
