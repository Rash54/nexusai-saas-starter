# app/services/parsers/column_detector.py
# Auto-detects upload type and maps columns to our schema

from typing import Dict, List, Tuple, Optional


# ── Column name aliases for each field ────────────────────────────────────────
# Maps our canonical field name → list of column names we recognise from exports

REVENUE_ALIASES: Dict[str, List[str]] = {
    "date":              ["date", "period", "month", "day", "created_at", "timestamp", "time"],
    "mrr":               ["mrr", "monthly recurring revenue", "monthly_recurring_revenue", "recurring revenue"],
    "arr":               ["arr", "annual recurring revenue", "annual_recurring_revenue"],
    "new_mrr":           ["new mrr", "new_mrr", "new revenue", "expansion", "new business"],
    "churned_mrr":       ["churned mrr", "churned_mrr", "churn revenue", "lost revenue", "cancellations"],
    "expansion_mrr":     ["expansion mrr", "expansion_mrr", "upgrade revenue", "upgrades"],
    "total_revenue":     ["revenue", "total revenue", "gross revenue", "net revenue", "amount", "total"],
    "new_customers":     ["new customers", "new_customers", "new subs", "new subscriptions", "signups"],
    "churned_customers": ["churned customers", "churned_customers", "cancellations", "churned"],
    "total_customers":   ["customers", "total customers", "active customers", "subscribers", "paying users"],
    "churn_rate":        ["churn rate", "churn_rate", "churn %", "monthly churn"],
    "arpu":              ["arpu", "avg revenue per user", "average revenue per user", "arppu"],
}

GA4_ALIASES: Dict[str, List[str]] = {
    "date":              ["date", "day", "week", "month"],
    "sessions":          ["sessions", "visits", "session"],
    "users":             ["users", "total users", "active users", "user"],
    "new_users":         ["new users", "new_users", "first time users"],
    "pageviews":         ["pageviews", "page views", "views", "screen views"],
    "bounce_rate":       ["bounce rate", "bounce_rate", "bounces %"],
    "session_duration":  ["avg session duration", "session duration", "time on site", "engagement time"],
    "conversions":       ["conversions", "goal completions", "events", "key events"],
    "conversion_rate":   ["conversion rate", "cvr", "goal conversion rate"],
    "source":            ["source", "traffic source", "acquisition source"],
    "medium":            ["medium", "channel", "channel group", "default channel group"],
    "campaign":          ["campaign", "campaign name", "utm_campaign"],
}

AD_ALIASES: Dict[str, List[str]] = {
    "date":              ["date", "day", "reporting starts", "report date"],
    "campaign_name":     ["campaign name", "campaign", "campaign_name"],
    "campaign_id":       ["campaign id", "campaign_id"],
    "ad_set_name":       ["ad set name", "ad set", "adset name", "ad group", "ad group name"],
    "ad_name":           ["ad name", "ad", "creative name"],
    "objective":         ["objective", "campaign objective", "buying type"],
    "impressions":       ["impressions", "impr.", "impr"],
    "reach":             ["reach", "unique reach"],
    "clicks":            ["clicks", "link clicks", "all clicks"],
    "ctr":               ["ctr", "ctr (link click-through rate)", "click-through rate", "ctr (all)"],
    "cpc":               ["cpc", "cost per click", "cost per link click", "avg. cpc"],
    "cpm":               ["cpm", "cost per 1,000 impressions", "avg. cpm"],
    "spend":             ["amount spent", "spend", "cost", "total cost", "budget spent"],
    "conversions":       ["conversions", "results", "purchases", "leads", "installs"],
    "conversion_rate":   ["conversion rate", "result rate", "purchase rate"],
    "cost_per_conversion": ["cost per result", "cost per conversion", "cost per purchase", "cpa"],
    "revenue_attributed":  ["purchase conversion value", "conversion value", "revenue", "value"],
    "roas":              ["purchase roas", "roas", "return on ad spend"],
    "video_views":       ["video views", "3-second video views", "thruplays"],
    "video_completion_rate": ["video completion rate", "video plays at 100%"],
    "likes":             ["post reactions", "likes", "reactions"],
    "shares":            ["shares", "post shares"],
    "comments":          ["comments", "post comments"],
    "platform":          ["publisher platform", "platform", "network"],
}

AD_PLATFORM_SIGNALS = {
    "facebook":  ["facebook", "fb", "meta", "instagram"],
    "google":    ["google", "adwords", "google ads", "gads"],
    "tiktok":    ["tiktok", "tik tok"],
    "linkedin":  ["linkedin"],
}


def normalise(s: str) -> str:
    """Lowercase, strip, collapse whitespace."""
    return " ".join(s.lower().strip().split())


def detect_upload_type(columns: List[str]) -> Tuple[str, Optional[str]]:
    """
    Returns (upload_type, ad_platform_or_None).
    upload_type: revenue_mrr | ad_platform | google_analytics | custom
    """
    cols_norm = [normalise(c) for c in columns]
    cols_set  = set(cols_norm)

    # Check for ad platform signals in column names or values
    ad_score = 0
    ga_score = 0
    rev_score = 0

    for c in cols_norm:
        if any(k in c for k in ["impressions", "ctr", "cpc", "cpm", "spend", "amount spent", "roas"]):
            ad_score += 2
        if any(k in c for k in ["sessions", "pageviews", "bounce", "session duration", "channel group"]):
            ga_score += 2
        if any(k in c for k in ["mrr", "arr", "churn", "recurring", "subscription"]):
            rev_score += 2
        if any(k in c for k in ["clicks", "reach", "campaign"]):
            ad_score += 1
        if any(k in c for k in ["users", "new users", "source", "medium"]):
            ga_score += 1
        if any(k in c for k in ["revenue", "customers", "arpu"]):
            rev_score += 1

    best = max(ad_score, ga_score, rev_score)
    if best == 0:
        return "custom", None

    if ad_score == best:
        # Detect specific platform from column names
        platform = _detect_ad_platform(cols_norm)
        return "ad_platform", platform
    elif ga_score == best:
        return "google_analytics", None
    else:
        return "revenue_mrr", None


def _detect_ad_platform(cols_norm: List[str]) -> str:
    all_text = " ".join(cols_norm)
    if "tiktok" in all_text or "tik tok" in all_text:
        return "tiktok"
    if "google" in all_text or "adwords" in all_text:
        return "google"
    if "linkedin" in all_text:
        return "linkedin"
    # Default to facebook (most common)
    return "facebook"


def map_columns(columns: List[str], upload_type: str) -> Dict[str, str]:
    """
    Returns mapping: our_field_name → actual_column_name_in_file
    """
    alias_map = {
        "revenue_mrr":      REVENUE_ALIASES,
        "google_analytics": GA4_ALIASES,
        "ad_platform":      AD_ALIASES,
        "custom":           {},
    }.get(upload_type, {})

    result: Dict[str, str] = {}
    cols_norm = {normalise(c): c for c in columns}  # normalised → original

    for field, aliases in alias_map.items():
        for alias in aliases:
            if alias in cols_norm:
                result[field] = cols_norm[alias]
                break

    return result
