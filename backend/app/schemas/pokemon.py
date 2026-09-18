"""
Schemas de resposta de /api/pokemon (Etapa 6 + continuação da V3).

PokemonOut: listagem simples (stats BASE, sem nível aplicado) — sem
regra de negócio.

PokemonStatsOut: resposta de GET /api/pokemon/{pokeapiId}/stats, com os
stats já calculados pro nível pedido (via app.services.pokemon_service,
que por sua vez usa app.core.stats — nenhuma fórmula duplicada aqui).
camelCase por consistência com o resto da API voltada pro frontend.
"""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PokemonOut(BaseModel):
    pokeapi_id: int
    name: str
    national_dex_number: int
    type1: str
    type2: Optional[str] = None
    base_hp: int
    base_atk: int
    base_def: int
    base_sp_atk: int
    base_sp_def: int
    base_speed: int


class PokemonStatsOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pokeapi_id: int = Field(alias="pokeapiId")
    name: str
    level: int
    type1: str
    type2: Optional[str] = None
    hp: int
    atk: int
    def_: int = Field(alias="def")
    sp_atk: int = Field(alias="spAtk")
    sp_def: int = Field(alias="spDef")
    speed: int
