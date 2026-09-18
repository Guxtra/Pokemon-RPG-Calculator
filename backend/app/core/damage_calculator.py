"""
damage_calculator — motor central de cálculo de dano do RPG. Port 1:1
de src/core/damageCalculator.ts.

FÓRMULA PRÓPRIA DO RPG (não reproduz o cálculo interno dos jogos Pokémon):

  Dano Base = (Poder / 10) * (Ataque relevante / Defesa relevante)
    - Físico   -> ATK / DEF
    - Especial -> Sp. ATK / Sp. DEF

  Dano Final = Dano Base * STAB * Efetividade * Crítico * Modificador

ORDEM DE EXECUÇÃO (preservada 1:1 do TS — ver decisão 7 da V3):
  1. Aplicar modificações absolutas de atributos
  2. Calcular Dano Base
  3. Aplicar STAB
  4. Aplicar efetividade de tipo
  5. Aplicar crítico
  6. Aplicar Modificador
  7. Arredondar o Dano Final (e somente ele) para inteiro

POLÍTICA DE ARREDONDAMENTO:
  - Precisão total (ponto flutuante) durante TODOS os cálculos intermediários.
  - Apenas o Dano Final é arredondado, para inteiro, com round-half-up
    (metades arredondam para cima — ex.: 8.5 -> 9).
  - O resultado nunca fica abaixo de 0.

Regras extras da V1: defesa efetiva na divisão tem piso mínimo de 1
(evita divisão por zero); ATK/Sp. ATK podem ser 0 (dano base 0);
Poder = 0 -> movimento sem dano direto (is_damaging_move = False).

O motor não depende de FastAPI/SQLAlchemy — pode ser executado
isoladamente (testes, um script, etc.), sem duplicar lógica.
"""
import math

from app.core.modifier_calculator import apply_stat_modifier, calculate_critical, normalize_multiplier
from app.core.models import (
    DamageInput,
    DamageResult,
    EffectiveStats,
    EffectivenessBreakdownEntry,
)
from app.core.type_calculator import calculate_stab, calculate_type_effectiveness
from app.core.validators import validate_battle_input

MIN_EFFECTIVE_DEFENSE = 1
"""Piso mínimo da defesa usada na divisão."""

POWER_DIVISOR = 10
"""Fator fixo da fórmula do RPG: Poder / 10."""


def calculate_base_damage(power: float, effective_attack: float, effective_defense: float) -> float:
    """Dano Base = (Poder / 10) * (Ataque relevante / Defesa relevante). Retorna 0 se Poder = 0."""
    if power == 0:
        return 0
    return (power / POWER_DIVISOR) * (effective_attack / effective_defense)


def round_final_damage(value: float) -> float:
    """
    Arredonda o dano final para inteiro: round-half-up (metade
    arredonda para cima), com piso 0. Único ponto de arredondamento
    do motor.
    """
    if value <= 0:
        return 0
    return math.floor(value + 0.5)


def calculate_final_damage(
    base_damage: float,
    stab_multiplier: float,
    effectiveness_multiplier: float,
    critical_multiplier: float,
    other_multiplier: float,
) -> float:
    """Combina todos os multiplicadores na ordem definida pelas regras e arredonda só o final."""
    raw_damage = (
        base_damage * stab_multiplier * effectiveness_multiplier * critical_multiplier * other_multiplier
    )
    return round_final_damage(raw_damage)


def calculate_damage(input: DamageInput) -> DamageResult:
    """
    Ponto de entrada do motor. Valida a entrada e lança um `ValueError`
    (com a lista de problemas) se ela for inválida — o motor não confia
    apenas na validação feita pela interface, pois pode ser chamado por
    qualquer consumidor futuro (API, testes) sem passar pela UI.

    :raises ValueError: se a entrada for inválida.
    """
    validation = validate_battle_input(input)
    if not validation.valid:
        summary = "\n".join(f"- {e.message}" for e in validation.errors)
        raise ValueError(f"Entrada inválida:\n{summary}")

    attacker, move, defender, modifiers = (
        input.attacker,
        input.move,
        input.defender,
        input.modifiers,
    )
    is_physical = move.category == "PHYSICAL"
    is_damaging_move = move.power > 0

    # 1) Modificações absolutas de atributos (sempre aplicadas, mesmo sem
    #    dano, pois um golpe de poder 0 pode alterar atributos do defensor).
    attacker_mods = attacker.stat_modifiers or {}
    defender_mods = defender.stat_modifiers or {}

    attack_detail = apply_stat_modifier(
        attacker.atk if is_physical else attacker.sp_atk,
        attacker_mods.get("atk", 0) if is_physical else attacker_mods.get("spAtk", 0),
        0,
    )
    defense_detail = apply_stat_modifier(
        defender.def_ if is_physical else defender.sp_def,
        defender_mods.get("def", 0) if is_physical else defender_mods.get("spDef", 0),
        MIN_EFFECTIVE_DEFENSE,
    )

    critical_multiplier = calculate_critical(modifiers.critical)
    other_multiplier = normalize_multiplier(modifiers.multiplier)

    base_damage = 0
    stab_multiplier = 1
    effectiveness_multiplier = 1
    effectiveness_breakdown: list[EffectivenessBreakdownEntry] = []
    final_damage = 0

    if is_damaging_move:
        # 2) Dano Base
        base_damage = calculate_base_damage(move.power, attack_detail.effective, defense_detail.effective)

        # 3) STAB
        stab_multiplier = calculate_stab(attacker, move.type)

        # 4) Efetividade de tipo
        effectiveness = calculate_type_effectiveness(move.type, defender)
        effectiveness_multiplier = effectiveness.multiplier
        effectiveness_breakdown = effectiveness.breakdown

        # 5, 6 e 7) Crítico, Modificador e arredondamento final
        final_damage = calculate_final_damage(
            base_damage,
            stab_multiplier,
            effectiveness_multiplier,
            critical_multiplier,
            other_multiplier,
        )

    return DamageResult(
        is_damaging_move=is_damaging_move,
        base_damage=base_damage,
        effective_attack=attack_detail.effective,
        effective_defense=defense_detail.effective,
        stab_multiplier=stab_multiplier,
        effectiveness_multiplier=effectiveness_multiplier,
        critical_multiplier=critical_multiplier,
        other_multiplier=other_multiplier,
        final_damage=final_damage,
        effective_stats=EffectiveStats(
            atk=attack_detail.modified if is_physical else attacker.atk,
            sp_atk=attacker.sp_atk if is_physical else attack_detail.modified,
            def_=defense_detail.modified if is_physical else defender.def_,
            sp_def=defender.sp_def if is_physical else defense_detail.modified,
        ),
        attack_detail=attack_detail,
        defense_detail=defense_detail,
        effectiveness_breakdown=effectiveness_breakdown,
    )
