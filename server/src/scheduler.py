"""APScheduler wiring for periodic reminder dispatch."""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .database import AsyncSessionLocal
from .reminders.service import process_due_reminders

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler(tick_seconds: int) -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    sched = AsyncIOScheduler(timezone="UTC")
    sched.add_job(
        process_due_reminders,
        trigger=IntervalTrigger(seconds=tick_seconds),
        args=[AsyncSessionLocal],
        id="dispatch-reminders",
        coalesce=True,
        max_instances=1,
        replace_existing=True,
    )
    sched.start()
    _scheduler = sched
    logger.info("Reminder scheduler started (tick=%ss)", tick_seconds)
    return sched


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Reminder scheduler stopped")
