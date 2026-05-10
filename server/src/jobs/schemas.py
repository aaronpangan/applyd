import uuid
from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from ..models import JobPriority, JobStatus, WorkSetup


class JobCreate(BaseModel):
    company: str = Field(max_length=255)
    position: str = Field(max_length=255)
    work_setup: WorkSetup
    link: str = Field(max_length=2048)
    applied_at: date
    industry: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    salary_currency: str = Field("PHP", max_length=8)
    email_contact: str | None = Field(None, max_length=255)
    job_description: str | None = None
    status: JobStatus = JobStatus.BOOKMARKED
    priority: JobPriority = JobPriority.MEDIUM

    @model_validator(mode="after")
    def check_salary_range(self) -> Self:
        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValueError("salary_min must not exceed salary_max")
        return self


class JobUpdate(BaseModel):
    company: str | None = Field(None, max_length=255)
    position: str | None = Field(None, max_length=255)
    work_setup: WorkSetup | None = None
    link: str | None = Field(None, max_length=2048)
    applied_at: date | None = None
    industry: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    salary_currency: str | None = Field(None, max_length=8)
    email_contact: str | None = Field(None, max_length=255)
    job_description: str | None = None
    status: JobStatus | None = None
    priority: JobPriority | None = None

    @model_validator(mode="after")
    def check_salary_range(self) -> Self:
        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValueError("salary_min must not exceed salary_max")
        return self


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    company: str
    position: str
    industry: str | None
    location: str | None
    work_setup: WorkSetup
    salary_min: int | None
    salary_max: int | None
    salary_currency: str
    email_contact: str | None
    link: str
    job_description: str | None
    status: JobStatus
    priority: JobPriority
    applied_at: date
    is_archived: bool
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    limit: int
    pages: int


class Period(BaseModel):
    year: int
    month: int


class FilterOptionsResponse(BaseModel):
    statuses: list[JobStatus]
    priorities: list[JobPriority]
    work_setups: list[WorkSetup]
    companies: list[str]
    locations: list[str]
    periods: list[Period]


class BulkArchiveRequest(BaseModel):
    job_ids: list[uuid.UUID] = Field(min_length=1)


class DuplicateResponse(BaseModel):
    duplicate: bool
    message: str
