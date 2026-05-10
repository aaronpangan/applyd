from fastapi import HTTPException, status

JobNotFound = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Job not found",
)
