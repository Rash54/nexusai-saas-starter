# app/tasks/cleanup_tasks.py
import asyncio
from app.core.celery_app import celery_app
from app.core.logging import logger


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.cleanup_tasks.weekly_cleanup", bind=True, max_retries=2)
def weekly_cleanup(self):
    """
    Weekly: expire old invites, purge read notifications older than 90 days,
    delete processed webhook events older than 30 days, trim performance metrics.
    """
    async def _inner():
        from app.database.session import get_db_context
        from app.db.models.team import TeamInvite
        from app.db.models.notification import Notification
        from app.db.models.integration import WebhookEvent
        from app.db.models.team import PerformanceMetric
        from sqlalchemy import delete, select
        from datetime import datetime, timezone, timedelta

        now = datetime.now(timezone.utc)

        async with get_db_context() as db:
            # Delete expired uninvited team invites
            inv_result = await db.execute(
                delete(TeamInvite).where(
                    TeamInvite.expires_at < now,
                    TeamInvite.is_accepted == False,
                ).returning(TeamInvite.id)
            )
            invites_deleted = len(inv_result.fetchall())

            # Delete read notifications older than 90 days
            notif_cutoff = now - timedelta(days=90)
            notif_result = await db.execute(
                delete(Notification).where(
                    Notification.is_read == True,
                    Notification.created_at < notif_cutoff,
                ).returning(Notification.id)
            )
            notifs_deleted = len(notif_result.fetchall())

            # Delete processed webhook events older than 30 days
            webhook_cutoff = now - timedelta(days=30)
            webhook_result = await db.execute(
                delete(WebhookEvent).where(
                    WebhookEvent.status.in_(["processed", "skipped"]),
                    WebhookEvent.created_at < webhook_cutoff,
                ).returning(WebhookEvent.id)
            )
            webhooks_deleted = len(webhook_result.fetchall())

            # Trim performance metrics older than 14 days
            perf_cutoff = now - timedelta(days=14)
            perf_result = await db.execute(
                delete(PerformanceMetric).where(
                    PerformanceMetric.created_at < perf_cutoff,
                ).returning(PerformanceMetric.id)
            )
            perf_deleted = len(perf_result.fetchall())

            await db.commit()

        summary = {
            "invites_expired": invites_deleted,
            "notifications_pruned": notifs_deleted,
            "webhooks_pruned": webhooks_deleted,
            "perf_metrics_pruned": perf_deleted,
        }
        logger.info(f"Weekly cleanup complete: {summary}")
        return summary

    try:
        return _run(_inner())
    except Exception as exc:
        logger.error(f"Weekly cleanup failed: {exc}")
        raise self.retry(exc=exc, countdown=600)
