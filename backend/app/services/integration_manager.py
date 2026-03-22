# app/services/integration_manager.py
"""
Central manager for reading/writing integrations with encrypted credentials.
All services should use get_integration() / save_integration() rather than
touching the DB model directly, so encryption is always applied consistently.
"""
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.integration import Integration
from app.utils.encryption import encrypt_if_present, decrypt_if_present


async def get_integration(db: AsyncSession, org_id: UUID, provider: str) -> Optional[Integration]:
    """Fetch an integration and decrypt its credentials in-place."""
    result = await db.execute(
        select(Integration).where(
            Integration.organization_id == org_id,
            Integration.provider == provider,
            Integration.is_enabled == True,
            Integration.status == "active",
        )
    )
    integration = result.scalar_one_or_none()
    if integration:
        # Decrypt credentials before returning — callers get plaintext
        integration.api_key = decrypt_if_present(integration.api_key)
        integration.access_token = decrypt_if_present(integration.access_token)
        integration.refresh_token = decrypt_if_present(integration.refresh_token)
        integration.webhook_secret = decrypt_if_present(integration.webhook_secret)
    return integration


async def save_integration_credentials(
    db: AsyncSession,
    integration: Integration,
    api_key: Optional[str] = None,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    webhook_secret: Optional[str] = None,
) -> None:
    """Encrypt and persist credentials onto an integration model."""
    if api_key is not None:
        integration.api_key = encrypt_if_present(api_key)
    if access_token is not None:
        integration.access_token = encrypt_if_present(access_token)
    if refresh_token is not None:
        integration.refresh_token = encrypt_if_present(refresh_token)
    if webhook_secret is not None:
        integration.webhook_secret = encrypt_if_present(webhook_secret)
    await db.commit()
