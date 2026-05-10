from fastapi import HTTPException, status

InvalidGoogleToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid Google token",
)

InvalidCredentials = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
