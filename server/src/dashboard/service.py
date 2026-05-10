import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Job, JobStatus
from . import schemas


async def get_dashboard_stats(
    db: AsyncSession, user_id: uuid.UUID
) -> schemas.DashboardStats:
    active = (Job.user_id == user_id, Job.is_archived.is_(False))

    total_result = await db.execute(
        select(func.count()).select_from(Job).where(*active)
    )
    total_active = total_result.scalar_one()

    today = date.today()

    applied_result = await db.execute(
        select(func.count()).select_from(Job).where(*active, Job.status != JobStatus.BOOKMARKED)
    )
    total_applied = applied_result.scalar_one()

    applied_this_month_result = await db.execute(
        select(func.count()).select_from(Job).where(
            *active,
            Job.status != JobStatus.BOOKMARKED,
            func.extract("month", Job.applied_at) == today.month,
            func.extract("year", Job.applied_at) == today.year,
        )
    )
    total_applied_this_month = applied_this_month_result.scalar_one()

    interviews_result = await db.execute(
        select(func.count()).select_from(Job).where(
            *active,
            Job.status.in_([JobStatus.PHONE_SCREEN, JobStatus.TECH_INTERVIEW, JobStatus.FINAL_INTERVIEW]),
        )
    )
    scheduled_interviews = interviews_result.scalar_one()

    offers_result = await db.execute(
        select(func.count()).select_from(Job).where(
            *active,
            Job.status.in_([JobStatus.OFFER, JobStatus.ACCEPTED]),
        )
    )
    total_offers = offers_result.scalar_one()

    status_result = await db.execute(
        select(Job.status, func.count().label("count")).where(*active).group_by(Job.status)
    )
    priority_result = await db.execute(
        select(Job.priority, func.count().label("count")).where(*active).group_by(Job.priority)
    )
    setup_result = await db.execute(
        select(Job.work_setup, func.count().label("count")).where(*active).group_by(Job.work_setup)
    )

    return schemas.DashboardStats(
        total_active=total_active,
        total_applied=total_applied,
        total_applied_this_month=total_applied_this_month,
        scheduled_interviews=scheduled_interviews,
        total_offers=total_offers,
        by_status=[
            schemas.StatusCount(status=r.status, count=r.count)
            for r in status_result
        ],
        by_priority=[
            schemas.PriorityCount(priority=r.priority, count=r.count)
            for r in priority_result
        ],
        by_work_setup=[
            schemas.WorkSetupCount(work_setup=r.work_setup, count=r.count)
            for r in setup_result
        ],
    )
