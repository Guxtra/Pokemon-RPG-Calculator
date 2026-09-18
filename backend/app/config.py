"""
Configuração da aplicação, carregada de variáveis de ambiente (.env em
desenvolvimento; variáveis reais de ambiente no Railway em produção).

Nenhum outro módulo do backend deve ler `os.environ` diretamente — tudo
passa por aqui, para que exista um único lugar responsável por saber
quais variáveis existem e quais são os seus valores padrão.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS vem como string separada por vírgula no .env."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cacheado: as variáveis de ambiente não mudam durante a execução do processo."""
    return Settings()


settings = get_settings()
