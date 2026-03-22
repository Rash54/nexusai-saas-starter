# app/services/email_service.py — Community Edition stub
# Full transactional email (Resend) available in NexusAI Pro

from app.core.logging import logger


async def send_welcome_email(to_email: str, full_name: str = "", org_name: str = "", **kwargs) -> None:
    logger.info(f"[Community] Welcome email skipped for {to_email} (Pro feature)")


async def send_team_invite(to_email: str, **kwargs) -> None:
    logger.info(f"[Community] Team invite email skipped for {to_email} (Pro feature)")


async def send_alert_email(to_email: str, **kwargs) -> None:
    logger.info(f"[Community] Alert email skipped for {to_email} (Pro feature)")
