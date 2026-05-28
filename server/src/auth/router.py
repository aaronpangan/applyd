from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import Settings, get_settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from . import schemas, service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify", response_model=schemas.TokenResponse)
async def verify_google_token(
    payload: schemas.GoogleVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
):
    token_response = await service.verify_google_token(db, payload)
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=settings.JWT_EXPIRY_MINUTES * 60,
    )
    return token_response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", samesite="lax", httponly=True)


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.post("/dev-token", response_model=schemas.TokenResponse)
async def dev_token(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    if settings.ENV != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return await service.create_dev_token(db)

    
    
    
    
    
    
    
    
    
    en(db)
