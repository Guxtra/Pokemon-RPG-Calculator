"""
services/pokemon_service.py — orquestra banco + core para calcular os
atributos (ATK/DEF/Sp.ATK/Sp.DEF) de um Pokémon num nível dado (Etapa 5).

Não duplica a fórmula: busca os base stats no banco e delega o cálculo
a app.core.stats.calculate_pokemon_stats (o core é a fonte da verdade —
decisão aprovada da V3). HP e Speed não passam pela fórmula porque o
core não a define para eles (ver core/stats.py) — voltam como base
stat puro.

Erros são levantados como PokemonServiceError, carregando uma lista de
ValidationError (o mesmo dataclass {field, message} já usado pelo core
em validators.py), para a camada HTTP (Etapa 6) converter direto no
formato único de erro do backend.
"""
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.stats import calculate_pokemon_stats
from app.core.validators import ValidationError
from app.models.pokemon import Pokemon

MIN_LEVEL = 1
MAX_LEVEL = 100


class PokemonServiceError(Exception):
    """Erro de orquestração do service. `errors` já vem no formato
    único {field, message}[] para a API repassar direto na resposta."""

    def __init__(self, errors: List[ValidationError]):
        self.errors = errors
        super().__init__("; ".join(f"{e.field}: {e.message}" for e in errors))


@dataclass
class PokemonStatsResult:
    pokeapi_id: int
    name: str
    level: int
    type1: str
    type2: Optional[str]
    hp: int  # base stat puro — HP não entra na fórmula de nível (ver core/stats.py)
    atk: int
    def_: int
    sp_atk: int
    sp_def: int
    speed: int  # base stat puro — não usado no cálculo de dano hoje


def _find_pokemon(db: Session, pokemon_id: Optional[int], name: Optional[str]) -> Pokemon:
    if (pokemon_id is None) == (name is None):
        raise PokemonServiceError(
            [
                ValidationError(
                    field="pokemon",
                    message="Informe pokemon_id ou name (exatamente um dos dois).",
                )
            ]
        )

    query = db.query(Pokemon)
    if pokemon_id is not None:
        pokemon = query.filter_by(pokeapi_id=pokemon_id).one_or_none()
        identifier = pokemon_id
    else:
        pokemon = query.filter_by(name=name.strip().lower()).one_or_none()
        identifier = name

    if pokemon is None:
        raise PokemonServiceError(
            [ValidationError(field="pokemon", message=f"Pokémon '{identifier}' não encontrado.")]
        )
    return pokemon


def _validate_level(level: int) -> None:
    is_valid_int = isinstance(level, int) and not isinstance(level, bool)
    if not is_valid_int or not (MIN_LEVEL <= level <= MAX_LEVEL):
        raise PokemonServiceError(
            [
                ValidationError(
                    field="level",
                    message=f"Nível deve ser um número inteiro entre {MIN_LEVEL} e {MAX_LEVEL}.",
                )
            ]
        )


def get_pokemon_stats(
    db: Session,
    level: int,
    *,
    pokemon_id: Optional[int] = None,
    name: Optional[str] = None,
) -> PokemonStatsResult:
    """
    Busca um Pokémon (por pokeapi_id OU name — exatamente um dos dois) e
    calcula ATK/DEF/Sp.ATK/Sp.DEF para o nível informado, usando o core
    já testado na Etapa 3.

    Levanta PokemonServiceError se o nível estiver fora de 1-100, se nem
    ou ambos pokemon_id/name forem informados, ou se o Pokémon não for
    encontrado.
    """
    _validate_level(level)
    pokemon = _find_pokemon(db, pokemon_id, name)

    return PokemonStatsResult(
        pokeapi_id=pokemon.pokeapi_id,
        name=pokemon.name,
        level=level,
        type1=pokemon.type1.name,
        type2=pokemon.type2.name if pokemon.type2 else None,
        hp=pokemon.base_hp,
        atk=calculate_pokemon_stats(pokemon.base_atk, level),
        def_=calculate_pokemon_stats(pokemon.base_def, level),
        sp_atk=calculate_pokemon_stats(pokemon.base_sp_atk, level),
        sp_def=calculate_pokemon_stats(pokemon.base_sp_def, level),
        speed=pokemon.base_speed,
    )
