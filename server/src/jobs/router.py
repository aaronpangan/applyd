import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import get_current_user
from ..models import JobPriority, JobStatus, User, WorkSetup
from . import schemas, service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=schemas.JobListResponse)
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    job_status: JobStatus | None = Query(None, alias="status"),
    priority: JobPriority | None = Query(None),
    work_setup: WorkSetup | None = Query(None),
    is_archived: bool = Query(False),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.list_jobs(
        db,
        current_user.id,
        status=job_status,
        priority=priority,
        work_setup=work_setup,
        is_archived=is_archived,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/filter-options", response_model=schemas.FilterOptionsResponse)
async def get_filter_options(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.get_filter_options(db, current_user.id)


@router.get("/export/xlsx", response_class=StreamingResponse)
async def export_xlsx(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    job_status: JobStatus | None = Query(None, alias="status"),
    priority: JobPriority | None = Query(None),
    work_setup: WorkSetup | None = Query(None),
    is_archived: bool = Query(False),
    search: str | None = Query(None),
):
    return await service.export_xlsx(
        db,
        current_user.id,
        status=job_status,
        priority=priority,
        work_setup=work_setup,
        is_archived=is_archived,
        search=search,
    )


@router.patch("/bulk-archive", response_model=list[schemas.JobResponse])
async def bulk_archive(
    payload: schemas.BulkArchiveRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.bulk_archive(db, current_user.id, payload)


@router.post("", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: schemas.JobCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    force: bool = Query(False),
):
    result = await service.create_job(db, current_user.id, payload, force=force)
    if isinstance(result, dict) and result.get("duplicate"):
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    return result


@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.get_job(db, current_user.id, job_id)


@router.patch("/{job_id}", response_model=schemas.JobResponse)
async def update_job(
    job_id: uuid.UUID,
    payload: schemas.JobUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.update_job(db, current_user.id, job_id, payload)


@router.patch("/{job_id}/archive", response_model=schemas.JobResponse)
async def archive_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.archive_job(db, current_user.id, job_id)


@router.patch("/{job_id}/restore", response_model=schemas.JobResponse)
async def restore_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await service.restore_job(db, current_user.id, job_id)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await service.delete_job(db, current_user.id, job_id)
