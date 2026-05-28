import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from ..models import Job, Reminder
from . import schemas
from .email import send_reminder_email
from .exceptions import JobNotFound, ReminderNotFound

logger = logging.getLogger(__name__)


async def _require_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Job.id).where(Job.id == job_id, Job.user_id == user_id, Job.is_archived.is_(False))
    )
    if result.scalar_one_or_none() is None:
        raise JobNotFound


async def list_reminders(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> list[Reminder]:
    await _require_job(db, user_id, job_id)
    result = await db.execute(
        select(Reminder)
        .where(Reminder.job_id == job_id, Reminder.user_id == user_id)
        .order_by(Reminder.remind_at)
    )
    return result.scalars().all()


async def create_reminder(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    payload: schemas.ReminderCreate,
) -> Reminder:
    await _require_job(db, user_id, job_id)
    reminder = Reminder(
        job_id=job_id,
        user_id=user_id,
        remind_at=payload.remind_at,
        message=payload.message,
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


async def delete_reminder(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    reminder_id: uuid.UUID,
) -> None:
    await _require_job(db, user_id, job_id)
    result = await db.execute(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.job_id == job_id,
            Reminder.user_id == user_id,
        )
    )
    reminder = result.scalar_one_or_none()
    if reminder is None:
        raise ReminderNotFound
    await db.delete(reminder)
    await db.commit()


async def process_due_reminders(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    """Send all due, unsent reminders. Called periodically by the scheduler.

    A row whose send fails keeps ``is_sent = False`` so the next tick retries it.
    """
    async with session_maker() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Reminder)
            .where(Reminder.is_sent.is_(False), Reminder.remind_at <= now)
            .options(selectinload(Reminder.job), selectinload(Reminder.user))
        )
        reminders = list(result.scalars().all())

        if not reminders:
            return

        logger.info("Dispatching %d due reminder(s)", len(reminders))
        for reminder in reminders:
            try:
                await send_reminder_email(reminder)
                reminder.is_sent = True
            except Exception:
                logger.exception(
                    "Failed to send reminder %s; will retry on next tick", reminder.id
                )
        await db.commit()
