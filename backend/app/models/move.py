import enum

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MoveCategory(str, enum.Enum):
    """
    Mesmos dois valores usados pelo core (TS hoje, Python na Etapa 3) —
    de propósito, não os três `damage_class` da PokéAPI. Golpes de status
    (sem dano) recebem PHYSICAL por convenção na sincronização (decisão
    4): como power = 0, a categoria não produz nenhum efeito no cálculo.
    """

    PHYSICAL = "PHYSICAL"
    SPECIAL = "SPECIAL"


class Move(Base):
    __tablename__ = "move"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pokeapi_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type_id: Mapped[int] = mapped_column(ForeignKey("type.id"), nullable=False)

    # PokéAPI manda `null` para golpes de status — vira 0 aqui (decisão 4),
    # que já é o valor que o core entende como "sem dano direto".
    power: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    category: Mapped[MoveCategory] = mapped_column(
        Enum(MoveCategory, name="move_category"), nullable=False
    )

    # Guarda o damage_class original da PokéAPI ("physical"/"special"/
    # "status") só como informação — não é usado pelo cálculo.
    pokeapi_damage_class: Mapped[str] = mapped_column(String(20), nullable=False)

    type: Mapped["Type"] = relationship()
