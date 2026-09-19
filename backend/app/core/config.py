import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "DuiChinese API"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    SECRET_KEY: str = "duichinese_secret_key_change_me_in_production"
    
    # PostgreSQL by default, with fallback support
    DATABASE_URL: str = "postgresql+psycopg://duichinese:duichinese_dev_pass@localhost:5432/duichinese_db"
    SQLITE_FALLBACK: bool = True
    SQLITE_FALLBACK_URL: str = "sqlite:///./duichinese_local.db"
    
    # CORS Origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://duichinese.com",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

