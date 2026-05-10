import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Job, JobNote
from . import schemas
from .exceptions import JobNotFound


async def _require_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Job.id).where(Job.id == job_id, Job.user_id == user_id, Job.is_archived.is_(False))
    )
    if result.scalar_one_or_none() is None:
        raise JobNotFound


async def list_notes(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> list[JobNote]:
    await _require_job(db, user_id, job_id)
    result = await db.execute(
        select(JobNote)
        .where(JobNote.job_id == job_id, JobNote.user_id == user_id)
        .order_by(JobNote.created_at)
    )
    return result.scalars().all()


async def create_note(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    payload: schemas.NoteCreate,
) -> JobNote:
    await _require_job(db, user_id, job_id)
    note = JobNote(job_id=job_id, user_id=user_id, content=payload.content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note
