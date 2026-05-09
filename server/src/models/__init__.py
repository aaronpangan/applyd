from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from .job import Job, JobPriority, JobStatus, WorkSetup
from .job_note import JobNote
from .reminder import Reminder
from .user import User

__all__ = [
    "Base",
    "Job",
    "JobNote",
    "JobPriority",
    "JobStatus",
    "Reminder",
    "User",
    "WorkSetup",
]
