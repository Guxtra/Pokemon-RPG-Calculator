"""
modifier_calculator — modificações ABSOLUTAS de atributos e crítico.
Port 1:1 de src/core/modifierCalculator.ts.

Regra da V1: valores absolutos (soma/subtração), não estágios oficiais.
  ATK efetivo = ATK + mod   (idem DEF, Sp. ATK, Sp. DEF)

As modificações são aplicadas ANTES do cálculo do dano base.
"""
import math
from typing import Dict, Optional

from app.core.models import EffectiveStatDetail

CRITICAL_MULTIPLIER = 1.5


def apply_stat_modifier(
    original: float, modification: float = 0, minimum_for_calculation: float = 0
) -> EffectiveStatDetail:
    """
    Aplica uma modificação absoluta a um único atributo, retornando o
    detalhamento completo (original -> modificação -> modificado -> efetivo)
    para exibição/auditoria na interface.

    `minimum_for_calculation` garante que o valor usado na divisão nunca
    seja menor que esse piso (usado para DEF/Sp.DEF, que não podem ser 0
    na divisão). Para ATK/Sp.ATK, o piso é 0 — eles podem legitimamente
    resultar em dano base 0.
    """
    modified = original + modification
    effective = max(modified, minimum_for_calculation)
    return EffectiveStatDetail(
        original=original, modification=modification, modified=modified, effective=effective
    )


def normalize_stat_modifiers(mods: Optional[Dict[str, float]]) -> Dict[str, float]:
    """Normaliza modificadores parciais (ex.: {"def": -3}) preenchendo zeros."""
    mods = mods or {}
    return {
        "atk": mods.get("atk", 0),
        "def": mods.get("def", 0),
        "spAtk": mods.get("spAtk", 0),
        "spDef": mods.get("spDef", 0),
    }


def calculate_critical(is_critical: bool) -> float:
    """Multiplicador de crítico: 1.5 se ativado, 1 caso contrário (V1: apenas checkbox)."""
    return CRITICAL_MULTIPLIER if is_critical else 1


def normalize_multiplier(multiplier: Optional[float]) -> float:
    """Normaliza o campo "Modificador": valor padrão 1 quando ausente/indefinido."""
    if multiplier is None:
        return 1
    if isinstance(multiplier, float) and math.isnan(multiplier):
        return 1
    return multiplier
