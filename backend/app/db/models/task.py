# app/db/models/task.py

from sqlalchemy import Column, String, Text, ForeignKey, Index, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import UUIDBaseModel


class Task(UUIDBaseModel):
    __tablename__ = "tasks"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_to = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="todo", nullable=False)   # todo | in_progress | done
    priority = Column(String, default="medium", nullable=False)  # low | medium | high | urgent
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)

    organization = relationship("Organization", back_populates="tasks")

    __table_args__ = (
        Index("idx_tasks_org_id", "organization_id"),
        Index("idx_tasks_status", "status"),
    )
