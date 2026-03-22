# alembic/env.py
import asyncio
import os
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Import Base and ALL models so Alembic can detect them
from app.db.base import Base
import app.db.models  # noqa — registers every model

config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override the sqlalchemy.url with value from .env
database_url = os.getenv("DATABASE_URL", "")
config.set_main_option("sqlalchemy.url", database_url)

# This is what Alembic compares against your DB to detect changes
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations with an async DB connection."""
    ssl_disabled = os.getenv("SSL_DISABLED", "false").lower() == "true"
    connect_args = {} if ssl_disabled else {"ssl": "require"}

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()