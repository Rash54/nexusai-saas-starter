import asyncio
from sqlalchemy.exc import IntegrityError

from app.database.session import AsyncSessionLocal
from app.crud.user import (
    create_user,
    get_user_by_email,
    authenticate_user,
    update_user,
    delete_user
)

TEST_EMAIL = "advanced@example.com"
TEST_PASSWORD = "StrongPass123"


async def run_tests():
    async with AsyncSessionLocal() as session:

        print("\n--- CREATE USER ---")
        user = await create_user(
            session,
            TEST_EMAIL,
            TEST_PASSWORD
        )
        print("✅ Created:", user.email)

        print("\n--- DUPLICATE EMAIL TEST ---")
        try:
            await create_user(
                session,
                TEST_EMAIL,
                "AnotherPass"
            )
        except IntegrityError:
            await session.rollback()
            print("✅ Duplicate email blocked")

        print("\n--- AUTH SUCCESS ---")
        auth_user = await authenticate_user(
            session,
            TEST_EMAIL,
            TEST_PASSWORD
        )
        print("✅ Authenticated:", auth_user.email)

        print("\n--- AUTH FAILURE (WRONG PASSWORD) ---")
        bad_auth = await authenticate_user(
            session,
            TEST_EMAIL,
            "WrongPassword"
        )
        print("✅ Failed auth:", bad_auth is None)

        print("\n--- UPDATE USER ---")
        updated = await update_user(
            session,
            user,
            email="updated@example.com",
            is_active=False
        )
        print("✅ Updated email:", updated.email)
        print("✅ Active:", updated.is_active)

        print("\n--- FETCH UPDATED USER ---")
        fetched = await get_user_by_email(
            session,
            "updated@example.com"
        )
        print("✅ Fetched:", fetched.email)

        print("\n--- DELETE USER ---")
        await delete_user(session, fetched)
        deleted = await get_user_by_email(
            session,
            "updated@example.com"
        )
        print("✅ Deleted:", deleted is None)


if __name__ == "__main__":
    asyncio.run(run_tests())
