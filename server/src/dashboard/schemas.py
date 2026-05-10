from pydantic import BaseModel

from ..models import JobPriority, JobStatus, WorkSetup


class StatusCount(BaseModel):
    status: JobStatus
    count: int


class PriorityCount(BaseModel):
    priority: JobPriority
    count: int


class WorkSetupCount(BaseModel):
    work_setup: WorkSetup
    count: int


class DashboardStats(BaseModel):
    total_active: int
    total_applied: int
    total_applied_this_month: int
    scheduled_interviews: int
    total_offers: int
    by_status: list[StatusCount]
    by_priority: list[PriorityCount]
    by_work_setup: list[WorkSetupCount]
