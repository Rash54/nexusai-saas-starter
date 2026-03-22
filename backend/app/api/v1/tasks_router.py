# app/api/v1/tasks_router.py — Community Edition (read-only stub)
# Full task management with AI prioritisation available in NexusAI Pro

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.db.models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])

PRO_URL = "https://yusuf545.gumroad.com/l/ttazrg"

SAMPLE_TASKS = [
    {"id": "t-001", "title": "Review Q1 MRR report", "status": "todo", "priority": "high"},
    {"id": "t-002", "title": "Set up Stripe integration", "status": "in_progress", "priority": "high"},
    {"id": "t-003", "title": "Analyse churn cohort", "status": "todo", "priority": "medium"},
]


@router.get("")
async def list_tasks(current_user: User = Depends(get_current_user)):
    return {
        "tasks": SAMPLE_TASKS,
        "pro_note": "Upgrade to Pro to create, edit, and AI-prioritise unlimited tasks.",
        "upgrade_url": PRO_URL,
    }


@router.post("")
async def create_task(current_user: User = Depends(get_current_user)):
    return {
        "error": "Task creation is available in NexusAI Pro.",
        "upgrade_url": PRO_URL,
    }
