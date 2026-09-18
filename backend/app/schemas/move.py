"""
Schema de resposta de /api/moves (Etapa 6). Mesma lógica do pokemon.py:
listagem simples, sem regra de negócio nesta rota.
"""
from pydantic import BaseModel


class MoveOut(BaseModel):
    pokeapi_id: int
    name: str
    type: str
    power: int
    category: str
