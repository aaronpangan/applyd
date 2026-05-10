import asyncio
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from google.auth.exceptions import TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models import User
from . import schemas
from .exceptions import InvalidGoogleToken

_DEV_GOOGLE_ID = "dev_user_local"
_DEV_EMAIL = "dev@local.test"
_DEV_NAME = "Dev User"


def _create_jwt(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user.id),
            "iat": now,
            "exp": now + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )


async def _upsert_user(
    db: AsyncSession,
    *,
    google_id: str,
    email: str,
    name: str,
    avatar_url: str | None,
) -> User:
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if user:
        user.name = name
        user.avatar_url = avatar_url
        user.email = email
    else:
        user = User(google_id=google_id, email=email, name=name, avatar_url=avatar_url)
        db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def verify_google_token(
    db: AsyncSession,
    payload: schemas.GoogleVerifyRequest,
) -> schemas.TokenResponse:
    try:
        id_info = await asyncio.to_thread(
            id_token.verify_oauth2_token,
            payload.id_token,
            Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise InvalidGoogleToken
    except TransportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach Google authentication servers",
        )

    user = await _upsert_user(
        db,
        google_id=id_info["sub"],
        email=id_info["email"],
        name=id_info.get("name", ""),
        avatar_url=id_info.get("picture"),
    )
    return schemas.TokenResponse(access_token=_create_jwt(user))


async def create_dev_token(db: AsyncSession) -> schemas.TokenResponse:
    user = await _upsert_user(
        db,
        google_id=_DEV_GOOGLE_ID,
        email=_DEV_EMAIL,
        name=_DEV_NAME,
        avatar_url=None,
    )
    return schemas.TokenResponse(access_token=_create_jwt(user))
