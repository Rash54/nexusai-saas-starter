# app/api/v1/support.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.team import SupportTicket

router = APIRouter(prefix="/support", tags=["Support & Help"])

VALID_CATEGORIES = ["billing", "technical", "feature_request", "other"]
VALID_PRIORITIES = ["low", "normal", "high", "urgent"]


class TicketCreate(BaseModel):
    subject: str
    description: str
    category: Optional[str] = "other"
    priority: Optional[str] = "normal"
    attachments: Optional[list] = None


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None


@router.post("/tickets", status_code=201)
async def create_ticket(
    data: TicketCreate,
    org_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a support ticket."""
    ticket = SupportTicket(
        organization_id=org_id,
        user_id=current_user.id,
        subject=data.subject,
        description=data.description,
        category=data.category,
        priority=data.priority,
        attachments=data.attachments,
        status="open",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return {
        "ticket_id": str(ticket.id),
        "status": ticket.status,
        "message": "Ticket created. Our team will respond within 24 hours.",
    }


@router.get("/tickets")
async def list_tickets(
    status: Optional[str] = Query(None),
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List support tickets for the current user."""
    query = select(SupportTicket).where(SupportTicket.user_id == current_user.id)
    if status:
        query = query.where(SupportTicket.status == status)
    query = query.order_by(SupportTicket.created_at.desc()).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "created_at": t.created_at,
            "resolved_at": t.resolved_at,
        }
        for t in tickets
    ]


@router.get("/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific support ticket."""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "resolved_at": ticket.resolved_at,
        "attachments": ticket.attachments,
        "tags": ticket.tags,
    }


@router.get("/faq")
async def get_faq(current_user: User = Depends(get_current_user)):
    """Return common help articles and FAQ."""
    return {
        "articles": [
            {"title": "How to connect Stripe", "url": "/docs/integrations/stripe", "category": "integrations"},
            {"title": "Understanding MRR calculations", "url": "/docs/metrics/mrr", "category": "metrics"},
            {"title": "Setting up anomaly alerts", "url": "/docs/alerts", "category": "alerts"},
            {"title": "Inviting team members", "url": "/docs/team", "category": "team"},
            {"title": "Connecting your bank account (Plaid)", "url": "/docs/integrations/plaid", "category": "integrations"},
            {"title": "Exporting your data", "url": "/docs/data-export", "category": "data"},
            {"title": "Custom branding setup", "url": "/docs/branding", "category": "settings"},
            {"title": "Billing and subscription management", "url": "/docs/billing", "category": "billing"},
        ]
    }
