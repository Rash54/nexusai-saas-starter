# app/database/session.py
# Single source of truth for DB engine + session
#
# Uses NullPool for Neon PostgreSQL compatibility.
# Neon is a serverless DB that aggressively closes idle connections —
# connection pooling on the client side causes "connection was closed in
# the middle of operation" errors. NullPool opens a fresh connection per
# request and closes it immediately after, which is the correct pattern
# for Neon. Neon's own pooler (the -pooler URL) handles connection reuse
# on the server side.

import os
import ssl
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
SSL_DISABLED = os.getenv("SSL_DISABLED", "false").lower() == "true"

connect_args = {}
if not SSL_DISABLED and DATABASE_URL:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    future=True,
    # NullPool: no client-side pooling — required for Neon serverless.
    # Each request gets a fresh connection from Neon's pooler.
    poolclass=NullPool,
    connect_args=connect_args,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# FastAPI dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Context manager for scripts/background tasks
@asynccontextmanager
async def get_db_context():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
