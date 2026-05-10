import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from . import schemas, service

router = APIRouter(prefix="/jobs/{job_id}/reminders", tags=["reminders"])


@router.get("", response_model=list[schemas.ReminderResponse])
async def list_reminders(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.list_reminders(db, current_user.id, job_id)


@router.post("", response_model=schemas.ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    job_id: uuid.UUID,
    payload: schemas.ReminderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.create_reminder(db, current_user.id, job_id, payload)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    job_id: uuid.UUID,
    reminder_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await service.delete_reminder(db, current_user.id, job_id, reminder_id)
