# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.database.session import get_db
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import authenticate_user, register_user, generate_tokens
from app.dependencies.auth import get_current_user
from app.db.models.user import User
from app.core.security import decode_token, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=UserRead, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    user = await register_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login with email + password. Returns JWT access and refresh tokens."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    return generate_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest):
    """Exchange a refresh token for a new access token."""
    try:
        payload = decode_token(data.refresh_token)

        # Verify it is actually a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Issue new access token
        new_access_token = create_access_token({"sub": payload["sub"]})

        return {
            "access_token": new_access_token,
            "refresh_token": data.refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return current_user