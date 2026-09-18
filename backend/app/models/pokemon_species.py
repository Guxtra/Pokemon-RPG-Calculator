from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PokemonSpecies(Base):
    __tablename__ = "pokemon_species"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pokeapi_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    national_dex_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    generation_id: Mapped[int] = mapped_column(ForeignKey("generation.id"), nullable=False)
    is_legendary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_mythical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    generation: Mapped["Generation"] = relationship(back_populates="species")
    # Varieties/formas (V3: só a default por espécie, ver decisão 9 —
    # mas o relacionamento já suporta N por espécie para o futuro).
    varieties: Mapped[list["Pokemon"]] = relationship(back_populates="species")
