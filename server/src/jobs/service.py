import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Job
from . import schemas
from .exceptions import JobNotArchived, JobNotFound


async def _get_job_or_404(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> Job:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise JobNotFound
    return job


async def list_jobs(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    status=None,
    priority=None,
    work_setup=None,
    is_archived: bool = False,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> schemas.JobListResponse:
    base = select(Job).where(Job.user_id == user_id, Job.is_archived.is_(is_archived))

    if status is not None:
        base = base.where(Job.status == status)
    if priority is not None:
        base = base.where(Job.priority == priority)
    if work_setup is not None:
        base = base.where(Job.work_setup == work_setup)
    if search:
        term = f"%{search}%"
        base = base.where(or_(Job.company.ilike(term), Job.position.ilike(term)))

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar_one()

    items_result = await db.execute(
        base.order_by(Job.applied_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    items = items_result.scalars().all()

    pages = (total + limit - 1) // limit

    return schemas.JobListResponse(items=items, total=total, page=page, limit=limit, pages=pages)


async def get_filter_options(
    db: AsyncSession, user_id: uuid.UUID
) -> schemas.FilterOptionsResponse:
    base_where = Job.user_id == user_id

    async def _distinct(col):
        result = await db.execute(
            select(col).where(base_where, col.isnot(None)).distinct()
        )
        return result.scalars().all()

    periods_result = await db.execute(
        select(
            func.extract("year", Job.applied_at).label("year"),
            func.extract("month", Job.applied_at).label("month"),
        )
        .where(base_where)
        .distinct()
        .order_by(
            func.extract("year", Job.applied_at).desc(),
            func.extract("month", Job.applied_at).desc(),
        )
    )
    periods = [schemas.Period(year=int(r.year), month=int(r.month)) for r in periods_result]

    return schemas.FilterOptionsResponse(
        statuses=await _distinct(Job.status),
        priorities=await _distinct(Job.priority),
        work_setups=await _distinct(Job.work_setup),
        companies=await _distinct(Job.company),
        locations=await _distinct(Job.location),
        periods=periods,
    )


async def export_csv(db: AsyncSession, user_id: uuid.UUID) -> StreamingResponse:
    result = await db.execute(
        select(Job)
        .where(Job.user_id == user_id, Job.is_archived.is_(False))
        .order_by(Job.applied_at.desc())
    )
    jobs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "company", "position", "status", "priority", "work_setup",
        "location", "industry", "salary_min", "salary_max", "salary_currency",
        "applied_at", "link", "email_contact", "job_description", "created_at",
    ])
    for job in jobs:
        writer.writerow([
            job.company, job.position, job.status.value, job.priority.value,
            job.work_setup.value, job.location, job.industry,
            job.salary_min, job.salary_max, job.salary_currency,
            job.applied_at, job.link, job.email_contact, job.job_description,
            job.created_at,
        ])

    return StreamingResponse(
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=jobs.csv"},
    )


async def create_job(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: schemas.JobCreate,
    *,
    force: bool = False,
) -> Job | dict:
    if not force:
        dup = await db.execute(
            select(Job.id).where(
                Job.user_id == user_id,
                Job.company == payload.company,
                Job.position == payload.position,
                Job.is_archived.is_(False),
            )
        )
        if dup.scalar_one_or_none() is not None:
            return {
                "duplicate": True,
                "message": "A job with this company and position already exists.",
            }

    job = Job(user_id=user_id, **payload.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def get_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> Job:
    return await _get_job_or_404(db, user_id, job_id)


async def update_job(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    payload: schemas.JobUpdate,
) -> Job:
    job = await _get_job_or_404(db, user_id, job_id)

    for field in payload.model_fields_set:
        setattr(job, field, getattr(payload, field))

    await db.commit()
    await db.refresh(job)
    return job


async def archive_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> Job:
    job = await _get_job_or_404(db, user_id, job_id)
    job.is_archived = True
    job.archived_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return job


async def restore_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> Job:
    job = await _get_job_or_404(db, user_id, job_id)
    job.is_archived = False
    job.archived_at = None
    await db.commit()
    await db.refresh(job)
    return job


async def delete_job(
    db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> None:
    job = await _get_job_or_404(db, user_id, job_id)
    if not job.is_archived:
        raise JobNotArchived
    await db.delete(job)
    await db.commit()


async def bulk_archive(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: schemas.BulkArchiveRequest,
) -> list[Job]:
    result = await db.execute(
        select(Job).where(Job.id.in_(payload.job_ids), Job.user_id == user_id)
    )
    jobs = result.scalars().all()

    now = datetime.now(timezone.utc)
    for job in jobs:
        job.is_archived = True
        job.archived_at = now

    await db.commit()
    for job in jobs:
        await db.refresh(job)
    return jobs
