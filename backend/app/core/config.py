# app/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # App
    APP_NAME: str = "AI SaaS Founders Dashboard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production-supersecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    ENCRYPTION_SALT: str = os.getenv("ENCRYPTION_SALT", "saas-dashboard-salt-v1")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SSL_DISABLED: bool = os.getenv("SSL_DISABLED", "false").lower() == "true"
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() == "true"

    # Redis / Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    # CORS
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

    # AI Providers
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Email (Resend)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@yourdomain.com")

    # Banking
    PLAID_CLIENT_ID: str = os.getenv("PLAID_CLIENT_ID", "")
    PLAID_SECRET: str = os.getenv("PLAID_SECRET", "")
    PLAID_ENV: str = os.getenv("PLAID_ENV", "sandbox")  # sandbox | development | production

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

settings = Settings()
