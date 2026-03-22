# app/api/v1/health.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone

from app.database.session import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "AI SaaS Founders Dashboard API",
    }


@router.get("/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """Check database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
