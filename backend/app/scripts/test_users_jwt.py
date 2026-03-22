# app/scripts/test_users_jwt.py

import asyncio
from httpx import AsyncClient
from app.main import app
from app.scripts.reset_db import reset_db
from app.crud.user import get_user_by_email
from app.core.security import get_password_hash

async def main():
    await reset_db()
    
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        # 1️⃣ Create user
        user_data = {"email": "jwtuser@example.com", "password": "jwtpassword"}
        resp_create = await client.post("/users/", json={
            "email": user_data["email"],
            "password": get_password_hash(user_data["password"])
        })
        print("User created:", resp_create.json())

        # 2️⃣ Login user
        resp_login = await client.post("/auth/login", data={
            "username": user_data["email"],
            "password": "jwtpassword"
        })
        token = resp_login.json().get("access_token")
        print("JWT Token:", token)

        headers = {"Authorization": f"Bearer {token}"}

        # 3️⃣ Get current user
        resp_me = await client.get("/users/me", headers=headers)
        print("Current user:", resp_me.json())

        # 4️⃣ List users
        resp_list = await client.get("/users/", headers=headers)
        print("All users:", resp_list.json())

        # 5️⃣ Update user
        user_id = resp_list.json()[0]["id"]
        resp_update = await client.put(f"/users/{user_id}", headers=headers, json={"email": "updatedjwt@example.com"})
        print("Updated user:", resp_update.json())

        # 6️⃣ Delete user
        resp_delete = await client.delete(f"/users/{user_id}", headers=headers)
        print("Deleted user:", resp_delete.json())

if __name__ == "__main__":
    asyncio.run(main())
