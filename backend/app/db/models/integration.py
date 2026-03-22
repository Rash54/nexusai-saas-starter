# app/db/models/integration.py

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import UUIDBaseModel


class Integration(UUIDBaseModel):
    """
    Third-party app connections per organization.
    Stores OAuth tokens, API keys, and sync state.
    """
    __tablename__ = "integrations"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False, index=True)
    # stripe | posthog | mixpanel | plaid | mercury | openai | anthropic
    # hubspot | intercom | google_analytics | slack | notion | github | linear

    status = Column(String, default="active")           # active | paused | error | disconnected
    display_name = Column(String, nullable=True)        # friendly label set by user

    # Auth
    access_token = Column(Text, nullable=True)          # encrypted
    refresh_token = Column(Text, nullable=True)         # encrypted
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    api_key = Column(Text, nullable=True)               # encrypted
    webhook_secret = Column(String, nullable=True)

    # Sync state
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    sync_cursor = Column(String, nullable=True)         # pagination cursor for incremental sync
    config = Column(JSON, nullable=True)                # provider-specific config (account IDs, etc.)
    is_enabled = Column(Boolean, default=True)
    auto_sync = Column(Boolean, default=True)
    sync_interval_minutes = Column(String, default="60")

    organization = relationship("Organization")

    __table_args__ = (
        Index("idx_integration_org_provider", "organization_id", "provider"),
    )


class WebhookEvent(UUIDBaseModel):
    """Raw inbound webhook payloads for audit + replay."""
    __tablename__ = "webhook_events"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    provider = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    external_id = Column(String, nullable=True, index=True)   # provider's event ID (idempotency)
    payload = Column(JSON, nullable=False)
    status = Column(String, default="received")         # received | processed | failed | skipped
    processed_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)
    retry_count = Column(String, default="0")

    __table_args__ = (
        Index("idx_webhook_provider_type", "provider", "event_type"),
        Index("idx_webhook_external_id", "external_id"),
    )
