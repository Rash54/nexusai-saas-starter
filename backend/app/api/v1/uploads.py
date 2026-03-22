# app/api/v1/uploads.py — Community Edition (limited)
# Full AI-powered upload pipeline available in NexusAI Pro
# https://yusuf545.gumroad.com/l/ttazrg

import uuid
import asyncio
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.upload import DataUpload
from app.services.upload_service import process_upload, _upload_to_dict

router = APIRouter(prefix="/uploads", tags=["Data Uploads"])

MAX_FILE_SIZE_MB = 5
FREE_ROW_LIMIT = 500
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".xlsm"}
PRO_URL = "https://yusuf545.gumroad.com/l/ttazrg"


@router.post("/{org_id}", status_code=202)
async def upload_file(
    org_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    upload_type_hint: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV or Excel file. Community Edition: 5 MB / 500 rows, no AI analysis."""
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Community Edition limit is {MAX_FILE_SIZE_MB} MB. Upgrade to Pro for up to 50 MB.",
        )

    # Create upload record immediately so frontend gets a response right away
    upload_id = uuid.uuid4()
    upload = DataUpload(
        id=upload_id,
        organization_id=org_id,
        uploaded_by=current_user.id,
        original_name=file.filename,
        filename=file.filename,
        file_size_bytes=len(content),
        status="pending",
    )
    db.add(upload)
    await db.commit()

    # Parse and store in background — does not block the response
    background_tasks.add_task(
        process_upload,
        db, upload_id, content, file.filename or "upload.csv", org_id, upload_type_hint,
    )

    return {
        "upload_id": str(upload_id),
        "filename": file.filename,
        "size_mb": round(size_mb, 2),
        "status": "pending",
        "message": f"File received. Processing up to {FREE_ROW_LIMIT} rows.",
        "pro_note": "Upgrade to Pro for AI analysis, unlimited rows, and more.",
        "upgrade_url": PRO_URL,
    }


@router.get("/{org_id}")
async def list_uploads(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DataUpload)
        .where(DataUpload.organization_id == org_id)
        .order_by(desc(DataUpload.created_at))
        .limit(20)
    )
    uploads = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "original_filename": u.original_name,
            "status": u.status,
            "row_count": u.row_count,
            "upload_type": u.upload_type,
            "created_at": u.created_at,
            "insights": u.ai_insight_json,       # fixed: was u.insights
        }
        for u in uploads
    ]


@router.get("/{org_id}/{upload_id}")
async def get_upload(
    org_id: UUID,
    upload_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DataUpload).where(
            DataUpload.id == upload_id,
            DataUpload.organization_id == org_id,
        )
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {
        "id": str(upload.id),
        "original_filename": upload.original_name,
        "status": upload.status,
        "row_count": upload.row_count,
        "upload_type": upload.upload_type,
        "created_at": upload.created_at,
        "insights": upload.ai_insight_json,      # fixed: was upload.insights
        "pro_note": "AI analysis available in NexusAI Pro.",
        "upgrade_url": PRO_URL,
    }


@router.delete("/{org_id}/{upload_id}", status_code=204)
async def delete_upload(
    org_id: UUID,
    upload_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DataUpload).where(
            DataUpload.id == upload_id,
            DataUpload.organization_id == org_id,
        )
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    await db.delete(upload)
    await db.commit()