from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    ORS_API_KEY: str = ""
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"

settings = Settings()