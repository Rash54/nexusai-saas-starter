# app/utils/encryption.py
import base64, os
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.core.logging import logger

_fernet = None

def _get_fernet():
    global _fernet
    if _fernet is not None:
        return _fernet
    from app.core.config import settings
    secret = settings.SECRET_KEY.encode()
    salt = os.getenv("ENCRYPTION_SALT", "saas-dashboard-salt-v1").encode()
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100_000)
    key = base64.urlsafe_b64encode(kdf.derive(secret))
    _fernet = Fernet(key)
    return _fernet

def encrypt(value: str) -> str:
    if not value:
        return value
    try:
        return _get_fernet().encrypt(value.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise

def decrypt(value: str) -> str:
    if not value:
        return value
    try:
        return _get_fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        logger.warning("Decryption failed — invalid token")
        return ""
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return ""

def encrypt_if_present(value: Optional[str]) -> Optional[str]:
    return encrypt(value) if value else value

def decrypt_if_present(value: Optional[str]) -> Optional[str]:
    return decrypt(value) if value else value
