from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "Job Tracker API"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRY_MINUTES: int = 60
    GOOGLE_CLIENT_ID: str

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Applyd <onboarding@resend.dev>"
    REMINDER_TICK_SECONDS: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
