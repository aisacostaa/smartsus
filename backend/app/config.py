from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "smartsus"
    ORS_API_KEY: str = ""          # OpenRouteService
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"

settings = Settings()
