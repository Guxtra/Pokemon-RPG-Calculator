"""
SQLAlchemy síncrono (decisão aprovada: sem async/asyncpg nesta versão).

`Base` é a classe declarativa da qual todos os models (Etapa 2) herdarão.
`get_db` é a dependency do FastAPI que abre uma sessão por requisição e
garante que ela é fechada no final, mesmo se a requisição falhar.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
