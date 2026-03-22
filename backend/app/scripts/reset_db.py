# app/scripts/reset_db.py
import asyncio
from app.database.session import engine
from app.db.base import Base
import app.db.models  # noqa — registers all models

async def reset():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database reset complete.")

if __name__ == "__main__":
    asyncio.run(reset())
