from fastapi import HTTPException, status

JobNotFound = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Job not found",
)

JobNotArchived = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Job must be archived before it can be permanently deleted",
)
