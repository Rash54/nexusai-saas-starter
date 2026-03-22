# app/core/celery_app.py — Community Edition
# Background tasks via Celery are available in NexusAI Pro
# Upgrade at https://yusuf545.gumroad.com/l/ttazrg

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "nexusai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Pro Edition: forecast_tasks, metric_tasks registered here
    # Upgrade at https://yusuf545.gumroad.com/l/ttazrg
)
