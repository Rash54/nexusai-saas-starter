# app/db/models/upload.py
# Stores uploaded files, parsed rows, and AI-generated insights

from sqlalchemy import Column, String, Float, Integer, Boolean, Text, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import UUIDBaseModel


class UploadType(str, enum.Enum):
    revenue_mrr      = "revenue_mrr"       # Stripe / revenue CSV
    ad_platform      = "ad_platform"       # Facebook, Google Ads, TikTok
    google_analytics = "google_analytics"  # GA4 / funnel data
    custom           = "custom"            # Any CSV


class UploadStatus(str, enum.Enum):
    pending   = "pending"
    parsing   = "parsing"
    parsed    = "parsed"
    analyzing = "analyzing"
    complete  = "complete"
    failed    = "failed"


class AdPlatform(str, enum.Enum):
    facebook  = "facebook"
    google    = "google"
    tiktok    = "tiktok"
    instagram = "instagram"
    linkedin  = "linkedin"
    other     = "other"


class DataUpload(UUIDBaseModel):
    """
    Tracks every file a user uploads.
    One row per file. Parsed data stored in UploadedRow / AdCampaignMetric.

    AI insight columns (two, not three):
      ai_insight_json  -> GPT-4o-mini structured JSON
                          {headline, metrics_summary, top_issues, quick_wins}
      ai_insight_deep  -> Claude narrative text (deep analysis)
    """
    __tablename__ = "data_uploads"

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by     = Column(UUID(as_uuid=True), ForeignKey("users.id",         ondelete="SET NULL"), nullable=True)

    # File metadata
    filename        = Column(String(255), nullable=False)
    original_name   = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count       = Column(Integer, default=0)
    column_count    = Column(Integer, default=0)

    # Classification
    upload_type      = Column(String(50), nullable=False, default="custom")  # UploadType
    ad_platform      = Column(String(50), nullable=True)                      # AdPlatform if ad upload
    detected_columns = Column(JSON, default=list)   # Column names found in file
    column_mapping   = Column(JSON, default=dict)   # Our field -> their column name

    # Status
    status        = Column(String(30), default="pending")  # UploadStatus
    error_message = Column(Text, nullable=True)
    parse_warnings = Column(JSON, default=list)             # Non-fatal issues found

    # Date range of the data inside
    data_date_from = Column(String(20), nullable=True)  # ISO date string
    data_date_to   = Column(String(20), nullable=True)

    # AI analysis
    # REMOVED: ai_insight_quick (Text) — was never written to; ai_insight_json is the GPT store
    ai_insight_json = Column(JSON, nullable=True)        # GPT-4o-mini structured findings
    ai_insight_deep = Column(Text, nullable=True)        # Claude deep narrative insight
    ai_model_quick  = Column(String(50), nullable=True)  # e.g. "gpt-4o-mini"
    ai_model_deep   = Column(String(50), nullable=True)  # e.g. "claude-sonnet-4-20250514"
    ai_tokens_used  = Column(Integer, default=0)
    ai_cost_usd     = Column(Float, default=0.0)

    # Relationships
    rows       = relationship("UploadedRow",      back_populates="upload", cascade="all, delete-orphan", lazy="dynamic")
    ad_metrics = relationship("AdCampaignMetric", back_populates="upload", cascade="all, delete-orphan", lazy="dynamic")


class UploadedRow(UUIDBaseModel):
    """
    Normalized row of parsed data from any upload type.
    Revenue, funnel, and custom data stored here in a flat structure.
    """
    __tablename__ = "uploaded_rows"

    upload_id       = Column(UUID(as_uuid=True), ForeignKey("data_uploads.id",   ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id",  ondelete="CASCADE"), nullable=False, index=True)
    row_number      = Column(Integer, nullable=False)
    row_date        = Column(String(20), nullable=True)  # ISO date string

    # Revenue / MRR fields
    mrr               = Column(Float,   nullable=True)
    arr               = Column(Float,   nullable=True)
    new_mrr           = Column(Float,   nullable=True)
    churned_mrr       = Column(Float,   nullable=True)
    expansion_mrr     = Column(Float,   nullable=True)
    total_revenue     = Column(Float,   nullable=True)
    new_customers     = Column(Integer, nullable=True)
    churned_customers = Column(Integer, nullable=True)
    total_customers   = Column(Integer, nullable=True)
    churn_rate        = Column(Float,   nullable=True)
    arpu              = Column(Float,   nullable=True)

    # Funnel / GA4 fields
    sessions         = Column(Integer, nullable=True)
    users            = Column(Integer, nullable=True)
    new_users        = Column(Integer, nullable=True)
    pageviews        = Column(Integer, nullable=True)
    bounce_rate      = Column(Float,   nullable=True)
    session_duration = Column(Float,   nullable=True)
    conversions      = Column(Integer, nullable=True)
    conversion_rate  = Column(Float,   nullable=True)
    source           = Column(String(100), nullable=True)
    medium           = Column(String(100), nullable=True)
    campaign         = Column(String(200), nullable=True)

    # Raw / custom fields
    raw_data = Column(JSON, default=dict)  # Original row as-is

    upload = relationship("DataUpload", back_populates="rows")


class AdCampaignMetric(UUIDBaseModel):
    """
    Ad platform data: one row per campaign per date.
    Covers Facebook, Google Ads, TikTok, Instagram, LinkedIn.
    """
    __tablename__ = "ad_campaign_metrics"

    upload_id       = Column(UUID(as_uuid=True), ForeignKey("data_uploads.id",  ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Campaign identity
    platform      = Column(String(50),  nullable=False)   # facebook/google/tiktok
    campaign_id   = Column(String(200), nullable=True)
    campaign_name = Column(String(500), nullable=True)
    ad_set_name   = Column(String(500), nullable=True)
    ad_name       = Column(String(500), nullable=True)
    objective     = Column(String(100), nullable=True)    # awareness/traffic/conversions
    row_date      = Column(String(20),  nullable=True)

    # Core ad metrics
    impressions = Column(Integer, default=0)
    reach       = Column(Integer, nullable=True)
    clicks      = Column(Integer, default=0)
    ctr         = Column(Float,   nullable=True)          # Click-through rate %
    cpc         = Column(Float,   nullable=True)          # Cost per click
    cpm         = Column(Float,   nullable=True)          # Cost per 1000 impressions
    spend       = Column(Float,   default=0.0)            # Total spend $

    # Conversion metrics
    conversions          = Column(Integer, nullable=True)
    conversion_rate      = Column(Float,   nullable=True)
    cost_per_conversion  = Column(Float,   nullable=True)
    revenue_attributed   = Column(Float,   nullable=True) # Revenue from this campaign
    roas                 = Column(Float,   nullable=True)  # Return on ad spend

    # Video metrics (TikTok / Instagram)
    video_views           = Column(Integer, nullable=True)
    video_completions     = Column(Integer, nullable=True)
    video_completion_rate = Column(Float,   nullable=True)

    # Engagement
    likes    = Column(Integer, nullable=True)
    shares   = Column(Integer, nullable=True)
    comments = Column(Integer, nullable=True)

    # Raw
    raw_data = Column(JSON, default=dict)

    upload = relationship("DataUpload", back_populates="ad_metrics")