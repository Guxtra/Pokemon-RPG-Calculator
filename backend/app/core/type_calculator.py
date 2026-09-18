"""
type_calculator — efetividade de tipos e STAB. Port 1:1 de
src/core/typeCalculator.ts.

Acesso sempre data-driven (TYPE_CHART[tipo_ataque][tipo_defesa]) —
nenhum `if tipo == "fire"` vive aqui nem em nenhum outro lugar do motor.
"""
from dataclasses import dataclass, field
from typing import List

from app.core.models import Attacker, EffectivenessBreakdownEntry, PokemonType
from app.core.type_chart import TYPE_CHART

STAB_MULTIPLIER = 1.5


def _types_of(entity) -> List[PokemonType]:
    """Tipo(s) de uma criatura, ignorando Tipo 2 ausente."""
    types = [entity.type1]
    if entity.type2 and entity.type2 != entity.type1:
        types.append(entity.type2)
    return types


def calculate_stab(attacker: Attacker, move_type: PokemonType) -> float:
    """
    STAB (Same Type Attack Bonus), automático.

    ×1.5 se o tipo do golpe corresponder ao Tipo 1 OU ao Tipo 2 do
    atacante; ×1 caso contrário. O bônus NÃO acumula mesmo que o
    atacante tenha dois tipos batendo com o golpe.
    """
    return STAB_MULTIPLIER if move_type in _types_of(attacker) else 1


@dataclass
class EffectivenessResult:
    multiplier: float
    breakdown: List[EffectivenessBreakdownEntry] = field(default_factory=list)


def calculate_type_effectiveness(move_type: PokemonType, defender) -> EffectivenessResult:
    """
    Efetividade de tipo do golpe contra o(s) tipo(s) do defensor.

    Se o defensor tiver dois tipos, os multiplicadores contra cada tipo
    se multiplicam entre si (ex.: 2x * 2x = 4x, ou 0.5x * 0.5x = 0.25x).
    """
    breakdown = [
        EffectivenessBreakdownEntry(
            defense_type=defense_type, multiplier=TYPE_CHART[move_type][defense_type]
        )
        for defense_type in _types_of(defender)
    ]

    multiplier = 1.0
    for entry in breakdown:
        multiplier *= entry.multiplier

    return EffectivenessResult(multiplier=multiplier, breakdown=breakdown)
