from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Pokemon(Base):
    """
    Nível "variedade/forma" — corresponde ao recurso `pokemon` da PokéAPI
    (ex.: "charizard", "charizard-mega-x" seriam duas linhas aqui, ambas
    apontando pra mesma PokemonSpecies). Na V3 só importamos as linhas com
    is_default = True (decisão 9); formas alternativas ficam para depois,
    mas o modelo já suporta N linhas por espécie sem precisar migrar.

    base_speed é armazenado mesmo não sendo usado pelo cálculo de dano
    hoje — é um base stat oficial, guardá-lo agora evita re-sincronizar
    tudo se ele passar a ser necessário no futuro.
    """

    __tablename__ = "pokemon"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pokeapi_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    species_id: Mapped[int] = mapped_column(ForeignKey("pokemon_species.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    type1_id: Mapped[int] = mapped_column(ForeignKey("type.id"), nullable=False)
    type2_id: Mapped[int | None] = mapped_column(ForeignKey("type.id"), nullable=True)

    base_hp: Mapped[int] = mapped_column(Integer, nullable=False)
    base_atk: Mapped[int] = mapped_column(Integer, nullable=False)
    base_def: Mapped[int] = mapped_column(Integer, nullable=False)
    base_sp_atk: Mapped[int] = mapped_column(Integer, nullable=False)
    base_sp_def: Mapped[int] = mapped_column(Integer, nullable=False)
    base_speed: Mapped[int] = mapped_column(Integer, nullable=False)

    species: Mapped["PokemonSpecies"] = relationship(back_populates="varieties")
    type1: Mapped["Type"] = relationship(foreign_keys=[type1_id])
    type2: Mapped[Optional["Type"]] = relationship(foreign_keys=[type2_id])
