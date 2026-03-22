# app/services/upload_service.py — Community Edition (limited)
# Full AI-powered upload pipeline available in NexusAI Pro
# https://yusuf545.gumroad.com/l/ttazrg

from uuid import UUID
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.upload import DataUpload
from app.services.parsers.file_parser import parse_bytes
from app.services.parsers.column_detector import detect_upload_type
from app.core.logging import logger

FREE_ROW_LIMIT = 500
PRO_URL = "https://yusuf545.gumroad.com/l/ttazrg"


async def process_upload(
    db: AsyncSession,
    upload_id: UUID,
    content: bytes,
    filename: str,
    org_id: UUID,
    upload_type_hint: str = None,
) -> Dict[str, Any]:
    """
    Community Edition: parse file, store metadata, no AI analysis.
    Pro Edition adds: AI insight generation, ad metric parsing, unlimited rows.
    """
    upload = None
    try:
        # Need a fresh session for background task
        from app.database.session import get_db_context
        async with get_db_context() as fresh_db:
            result = await fresh_db.execute(select(DataUpload).where(DataUpload.id == upload_id))
            upload = result.scalar_one_or_none()
            if not upload:
                logger.error(f"Upload {upload_id} not found")
                return {"error": "Upload not found"}

            upload.status = "processing"
            await fresh_db.commit()

            # parse_bytes returns (columns: List[str], rows: List[Dict], warnings: List[str])
            columns, rows, warnings = parse_bytes(content, filename)
            row_count = len(rows)

            capped = row_count > FREE_ROW_LIMIT
            if capped:
                logger.info(f"Community Edition: capped to {FREE_ROW_LIMIT} rows (file had {row_count})")

            # detect_upload_type returns (upload_type, platform_or_None)
            if upload_type_hint:
                upload_type = upload_type_hint
            else:
                upload_type, _platform = detect_upload_type(columns)

            upload.upload_type = upload_type
            upload.row_count = row_count
            upload.column_count = len(columns)
            upload.detected_columns = columns
            upload.parse_warnings = warnings[:5] if warnings else []
            upload.status = "done"
            # Store community note in ai_insight_json field
            upload.ai_insight_json = {
                "community_note": f"Parsed {min(row_count, FREE_ROW_LIMIT)} of {row_count} rows.",
                "columns": columns,
                "capped": capped,
                "pro_locked": "AI insight generation available in NexusAI Pro.",
                "upgrade_url": PRO_URL,
            }
            await fresh_db.commit()

            return {
                "upload_id": str(upload_id),
                "rows_processed": min(row_count, FREE_ROW_LIMIT),
                "total_rows": row_count,
                "columns": columns,
                "upload_type": upload_type,
                "status": "done",
            }

    except Exception as e:
        logger.error(f"Upload processing error: {e}")
        try:
            from app.database.session import get_db_context
            async with get_db_context() as err_db:
                result = await err_db.execute(select(DataUpload).where(DataUpload.id == upload_id))
                upload = result.scalar_one_or_none()
                if upload:
                    upload.status = "error"
                    upload.error_message = str(e)
                    await err_db.commit()
        except Exception:
            pass
        return {"error": str(e)}


def _upload_to_dict(upload: DataUpload) -> Dict[str, Any]:
    return {
        "id": str(upload.id),
        "original_filename": upload.original_name,
        "status": upload.status,
        "row_count": upload.row_count,
        "upload_type": upload.upload_type,
        "created_at": upload.created_at,
        "insights": upload.ai_insight_json,
    }
