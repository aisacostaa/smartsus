from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Variáveis que já estavam no seu código
    ORS_API_KEY: str = ""
    CORS_ORIGINS: str = "*"

    # 1. Adicionamos as variáveis separadas exatamente como estão no seu .env
    DB_HOST: str
    DB_PORT: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # 2. Criamos a DATABASE_URL dinamicamente com base nas variáveis acima
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        # Como a porta é 3306, assumi que é MySQL. Se for PostgreSQL, mude para 'postgresql://'
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # 3. Nova forma do Pydantic v2 para ler o .env e ignorar campos extras do sistema
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Isso resolve o erro "Extra inputs are not permitted"
    )

settings = Settings()