import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_validator


class ReminderCreate(BaseModel):
    remind_at: datetime
    message: str

    @field_validator("remind_at")
    @classmethod
    def must_be_future(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError("remind_at must be a future datetime")
        return v


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    user_id: uuid.UUID
    remind_at: datetime
    message: str
    is_sent: bool
    created_at: datetime
