"""
Barrel do motor de cálculo — port 1:1 do TypeScript da V2 (decisão 3/21
da V3: Python é a fonte da verdade do cálculo a partir de agora).

Nenhum código de FastAPI/SQLAlchemy é importado aqui — o motor pode ser
usado isoladamente (scripts, testes, um futuro bot, etc.).
"""
from app.core.damage_calculator import (
    MIN_EFFECTIVE_DEFENSE,
    POWER_DIVISOR,
    calculate_base_damage,
    calculate_damage,
    calculate_final_damage,
    round_final_damage,
)
from app.core.modifier_calculator import (
    CRITICAL_MULTIPLIER,
    apply_stat_modifier,
    calculate_critical,
    normalize_multiplier,
    normalize_stat_modifiers,
)
from app.core.models import (
    Attacker,
    BattleModifiers,
    DamageInput,
    DamageResult,
    Defender,
    EffectiveStatDetail,
    EffectiveStats,
    EffectivenessBreakdownEntry,
    Move,
    MoveEffect,
)
from app.core.stats import calculate_pokemon_stats
from app.core.type_calculator import STAB_MULTIPLIER, calculate_stab, calculate_type_effectiveness
from app.core.type_catalog import TYPE_IDS, TYPE_LABELS
from app.core.type_chart import TYPE_CHART
from app.core.validators import ValidationError, ValidationResult, validate_battle_input

__all__ = [
    "MIN_EFFECTIVE_DEFENSE",
    "POWER_DIVISOR",
    "calculate_base_damage",
    "calculate_damage",
    "calculate_final_damage",
    "round_final_damage",
    "CRITICAL_MULTIPLIER",
    "apply_stat_modifier",
    "calculate_critical",
    "normalize_multiplier",
    "normalize_stat_modifiers",
    "Attacker",
    "BattleModifiers",
    "DamageInput",
    "DamageResult",
    "Defender",
    "EffectiveStatDetail",
    "EffectiveStats",
    "EffectivenessBreakdownEntry",
    "Move",
    "MoveEffect",
    "calculate_pokemon_stats",
    "STAB_MULTIPLIER",
    "calculate_stab",
    "calculate_type_effectiveness",
    "TYPE_IDS",
    "TYPE_LABELS",
    "TYPE_CHART",
    "ValidationError",
    "ValidationResult",
    "validate_battle_input",
]
