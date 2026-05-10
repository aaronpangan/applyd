import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from . import schemas, service

router = APIRouter(prefix="/jobs/{job_id}/notes", tags=["notes"])


@router.get("", response_model=list[schemas.NoteResponse])
async def list_notes(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.list_notes(db, current_user.id, job_id)


@router.post("", response_model=schemas.NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    job_id: uuid.UUID,
    payload: schemas.NoteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.create_note(db, current_user.id, job_id, payload)
