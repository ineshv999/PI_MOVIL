from functools import lru_cache
from typing import Literal
from urllib.parse import quote_plus

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración cargada exclusivamente desde variables de entorno."""

    app_name: str = "SGA API"
    app_env: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")

    postgres_db: str
    postgres_user: str
    postgres_password: str
    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    database_url_override: str | None = Field(default=None, validation_alias="DATABASE_URL")
    backend_cors_origins: str = ""
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    encryption_key: str
    refresh_token_expire_days: int = 7
    evidence_directory: str = "uploads/evidencias"
    max_evidence_size_mb: int = 5
    login_attempts_per_minute: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        return (
            "postgresql+psycopg2://"
            f"{quote_plus(self.postgres_user)}:{quote_plus(self.postgres_password)}@"
            f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.app_env == "production":
            weak = ("reemplaza", "cambia", "secret", "password")
            if len(self.jwt_secret_key) < 32 or any(x in self.jwt_secret_key.lower() for x in weak):
                raise ValueError("JWT_SECRET_KEY debe ser aleatoria y tener al menos 32 caracteres")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
