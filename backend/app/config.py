from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    ORS_API_KEY: str = ""
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()