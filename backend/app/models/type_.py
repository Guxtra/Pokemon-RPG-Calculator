from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Type(Base):
    __tablename__ = "type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pokeapi_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    # Nome em inglês minúsculo (ex.: "fire", "water") — já compatível com
    # os TYPE_IDS usados hoje no frontend (src/data/types.ts), sem
    # necessidade de nenhum mapeamento entre os dois lados.
    name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
