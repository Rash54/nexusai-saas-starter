# app/services/parsers/file_parser.py
# Parses CSV and Excel files into normalised Python dicts

import io
import csv
from typing import List, Dict, Any, Tuple
from datetime import datetime

from app.core.logging import logger


def _parse_float(val: Any) -> float | None:
    if val is None or str(val).strip() in ("", "-", "N/A", "n/a", "--"):
        return None
    s = str(val).strip().replace(",", "").replace("$", "").replace("%", "").replace("£", "").replace("€", "")
    try:
        return float(s)
    except ValueError:
        return None


def _parse_int(val: Any) -> int | None:
    f = _parse_float(val)
    return int(f) if f is not None else None


def _parse_date(val: Any) -> str | None:
    if val is None or str(val).strip() == "":
        return None
    s = str(val).strip()
    # Try common formats
    for fmt in [
        "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d",
        "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y",
        "%Y-%m", "%m/%Y", "%b %Y", "%B %Y",
        "%m-%d-%Y", "%d-%m-%Y",
    ]:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s  # Return as-is if we can't parse


def parse_bytes(content: bytes, filename: str) -> Tuple[List[str], List[Dict[str, Any]], List[str]]:
    """
    Parse CSV or Excel bytes.
    Returns: (columns, rows_as_dicts, warnings)
    """
    warnings: List[str] = []
    fname = filename.lower()

    if fname.endswith(".csv"):
        return _parse_csv(content, warnings)
    elif fname.endswith((".xlsx", ".xls", ".xlsm")):
        return _parse_excel(content, filename, warnings)
    else:
        # Try CSV as fallback
        warnings.append(f"Unknown extension — attempting CSV parse")
        return _parse_csv(content, warnings)


def _parse_csv(content: bytes, warnings: List[str]) -> Tuple[List[str], List[Dict], List[str]]:
    # Detect encoding
    for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = content.decode("utf-8", errors="replace")
        warnings.append("File encoding issues detected — some characters may be replaced")

    # Detect delimiter
    sample = text[:2000]
    dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    delimiter = dialect.delimiter if dialect else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    try:
        columns = list(reader.fieldnames or [])
    except Exception:
        columns = []

    rows = []
    for i, row in enumerate(reader):
        if i > 50000:  # Safety cap
            warnings.append("File truncated at 50,000 rows")
            break
        rows.append(dict(row))

    return columns, rows, warnings


def _parse_excel(content: bytes, filename: str, warnings: List[str]) -> Tuple[List[str], List[Dict], List[str]]:
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        ws = wb.active

        rows_raw = list(ws.iter_rows(values_only=True))
        if not rows_raw:
            return [], [], warnings + ["Empty spreadsheet"]

        # Find header row (first non-empty row)
        header_row = None
        data_start  = 0
        for i, row in enumerate(rows_raw):
            if any(cell is not None for cell in row):
                header_row = [str(c).strip() if c is not None else f"Column_{j}" for j, c in enumerate(row)]
                data_start = i + 1
                break

        if not header_row:
            return [], [], warnings + ["No header row found"]

        # Remove empty columns
        non_empty_cols = [j for j, h in enumerate(header_row) if h and h != f"Column_{j}"]
        columns = [header_row[j] for j in non_empty_cols]

        rows = []
        for i, row in enumerate(rows_raw[data_start:]):
            if i > 50000:
                warnings.append("File truncated at 50,000 rows")
                break
            if not any(cell is not None for cell in row):
                continue  # Skip blank rows
            row_dict = {columns[k]: row[j] for k, j in enumerate(non_empty_cols) if k < len(columns)}
            rows.append(row_dict)

        wb.close()
        return columns, rows, warnings

    except ImportError:
        warnings.append("openpyxl not installed — attempting CSV parse")
        return _parse_csv(content, warnings)
    except Exception as e:
        logger.error(f"Excel parse error: {e}")
        return [], [], warnings + [f"Excel parse failed: {str(e)}"]


def normalise_revenue_row(row: Dict, mapping: Dict[str, str], row_num: int) -> Dict[str, Any]:
    """Map a raw revenue CSV row to our canonical fields."""
    def g(field: str) -> Any:
        col = mapping.get(field)
        return row.get(col) if col else None

    return {
        "row_number":         row_num,
        "row_date":           _parse_date(g("date")),
        "mrr":                _parse_float(g("mrr")),
        "arr":                _parse_float(g("arr")),
        "new_mrr":            _parse_float(g("new_mrr")),
        "churned_mrr":        _parse_float(g("churned_mrr")),
        "expansion_mrr":      _parse_float(g("expansion_mrr")),
        "total_revenue":      _parse_float(g("total_revenue")),
        "new_customers":      _parse_int(g("new_customers")),
        "churned_customers":  _parse_int(g("churned_customers")),
        "total_customers":    _parse_int(g("total_customers")),
        "churn_rate":         _parse_float(g("churn_rate")),
        "arpu":               _parse_float(g("arpu")),
        "raw_data":           row,
    }


def normalise_ga4_row(row: Dict, mapping: Dict[str, str], row_num: int) -> Dict[str, Any]:
    """Map a raw GA4 / funnel CSV row to our canonical fields."""
    def g(field: str) -> Any:
        col = mapping.get(field)
        return row.get(col) if col else None

    return {
        "row_number":       row_num,
        "row_date":         _parse_date(g("date")),
        "sessions":         _parse_int(g("sessions")),
        "users":            _parse_int(g("users")),
        "new_users":        _parse_int(g("new_users")),
        "pageviews":        _parse_int(g("pageviews")),
        "bounce_rate":      _parse_float(g("bounce_rate")),
        "session_duration": _parse_float(g("session_duration")),
        "conversions":      _parse_int(g("conversions")),
        "conversion_rate":  _parse_float(g("conversion_rate")),
        "source":           str(g("source") or ""),
        "medium":           str(g("medium") or ""),
        "campaign":         str(g("campaign") or ""),
        "raw_data":         row,
    }


def normalise_ad_row(row: Dict, mapping: Dict[str, str], row_num: int, platform: str) -> Dict[str, Any]:
    """Map a raw ad platform CSV row to our canonical fields."""
    def g(field: str) -> Any:
        col = mapping.get(field)
        return row.get(col) if col else None

    impressions = _parse_int(g("impressions")) or 0
    clicks      = _parse_int(g("clicks")) or 0
    spend       = _parse_float(g("spend")) or 0.0
    conversions = _parse_int(g("conversions"))
    revenue     = _parse_float(g("revenue_attributed"))

    # Derive calculated fields if not present
    ctr  = _parse_float(g("ctr"))
    if ctr is None and impressions > 0:
        ctr = round((clicks / impressions) * 100, 4)

    cpc = _parse_float(g("cpc"))
    if cpc is None and clicks > 0 and spend > 0:
        cpc = round(spend / clicks, 4)

    cpm = _parse_float(g("cpm"))
    if cpm is None and impressions > 0 and spend > 0:
        cpm = round((spend / impressions) * 1000, 4)

    roas = _parse_float(g("roas"))
    if roas is None and spend > 0 and revenue:
        roas = round(revenue / spend, 4)

    cpa = _parse_float(g("cost_per_conversion"))
    if cpa is None and conversions and conversions > 0 and spend > 0:
        cpa = round(spend / conversions, 4)

    conv_rate = _parse_float(g("conversion_rate"))
    if conv_rate is None and clicks > 0 and conversions:
        conv_rate = round((conversions / clicks) * 100, 4)

    return {
        "platform":            platform,
        "row_date":            _parse_date(g("date")),
        "campaign_id":         str(g("campaign_id") or ""),
        "campaign_name":       str(g("campaign_name") or ""),
        "ad_set_name":         str(g("ad_set_name") or ""),
        "ad_name":             str(g("ad_name") or ""),
        "objective":           str(g("objective") or ""),
        "impressions":         impressions,
        "reach":               _parse_int(g("reach")),
        "clicks":              clicks,
        "ctr":                 ctr,
        "cpc":                 cpc,
        "cpm":                 cpm,
        "spend":               spend,
        "conversions":         conversions,
        "conversion_rate":     conv_rate,
        "cost_per_conversion": cpa,
        "revenue_attributed":  revenue,
        "roas":                roas,
        "video_views":         _parse_int(g("video_views")),
        "video_completion_rate": _parse_float(g("video_completion_rate")),
        "likes":               _parse_int(g("likes")),
        "shares":              _parse_int(g("shares")),
        "comments":            _parse_int(g("comments")),
        "raw_data":            row,
    }


def normalise_custom_row(row: Dict, row_num: int) -> Dict[str, Any]:
    """Store raw row as-is with row number."""
    return {"row_number": row_num, "raw_data": row}


def get_date_range(rows: List[Dict]) -> Tuple[str | None, str | None]:
    """Extract min/max date from parsed rows."""
    dates = [r.get("row_date") for r in rows if r.get("row_date")]
    if not dates:
        return None, None
    try:
        sorted_dates = sorted(dates)
        return sorted_dates[0], sorted_dates[-1]
    except Exception:
        return None, None


def summarise_for_ai(upload_type: str, rows: List[Dict], columns: List[str]) -> str:
    """
    Build a compact text summary of the data to send to AI.
    Keeps token usage low while giving AI enough to generate insights.
    """
    if not rows:
        return "No data rows found."

    lines = [
        f"Upload type: {upload_type}",
        f"Total rows: {len(rows)}",
        f"Columns: {', '.join(columns[:30])}",
        "",
        "Data sample (first 10 rows):",
    ]

    for i, row in enumerate(rows[:10]):
        # For AI, show only non-null fields
        relevant = {k: v for k, v in row.items() if k != "raw_data" and v is not None and v != "" and v != 0}
        lines.append(f"Row {i+1}: {relevant}")

    # Add aggregate stats if we have numeric data
    numeric_fields = ["mrr", "arr", "total_revenue", "spend", "impressions", "clicks", "sessions", "conversions"]
    stats_lines = []
    for field in numeric_fields:
        values = [r.get(field) for r in rows if r.get(field) is not None]
        if values:
            try:
                total = sum(float(v) for v in values)
                avg   = total / len(values)
                stats_lines.append(f"  {field}: total={total:,.2f}, avg={avg:,.2f}, count={len(values)}")
            except Exception:
                pass

    if stats_lines:
        lines.append("\nAggregate statistics:")
        lines.extend(stats_lines)

    return "\n".join(lines)
