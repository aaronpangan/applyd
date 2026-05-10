import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .dashboard.router import router as dashboard_router
from .database import engine
from .jobs.router import router as jobs_router
from .notes.router import router as notes_router
from .reminders.router import router as reminders_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Database connected")
    yield
    await engine.dispose()
    logger.info("Database disconnected")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(notes_router)
app.include_router(reminders_router)
app.include_router(dashboard_router)
