from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field, AliasChoices


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

    API_PREFIX: str = "/api"
    DEBUG: bool = False

    SQLALCHEMY_DATABASE_URL: str = Field(
        default="sqlite:///./database.db",
        validation_alias=AliasChoices("SQLALCHEMY_DATABASE_URL", "DATABASE_URL")
    )
    ALLOWED_ORIGINS: str = ""
    GROQ_API_KEY: str = ""

    @field_validator("ALLOWED_ORIGINS")
    def allowed_origins(cls, v: str) -> List[str]:
        return [origin.strip() for origin in v.split(",") if origin.strip()] if v else []

settings = Settings()