from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Generation(Base):
    __tablename__ = "generation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pokeapi_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    # Ordem numérica (1 = generation-i, 9 = generation-ix...) — usada para
    # filtrar o catálogo por "geração <= corte" na sincronização.
    order: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)

    species: Mapped[list["PokemonSpecies"]] = relationship(back_populates="generation")
