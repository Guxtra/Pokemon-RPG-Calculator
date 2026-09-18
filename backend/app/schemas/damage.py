"""
schemas/damage.py — request/response de POST /api/damage/calculate.

Pydantic aqui só valida FORMATO (tipos, presença de objetos aninhados).
Toda regra de negócio (>=0, tipos válidos, Tipo2 != Tipo1, categoria
válida) vive exclusivamente em app.core.validators.validate_battle_input
— não duplicada aqui (decisão aprovada da V3).

Convenção de nomes JSON: camelCase (spAtk, spDef, finalDamage...) e
"def" no lugar de "def_" (palavra reservada em Python) — consistente
com o contrato que o frontend (React/TS) já usa. Os campos numéricos
de entrada (atk, spAtk, def, spDef, power, multiplier) são Optional
mesmo sendo "obrigatórios" na regra de negócio: a mensagem de "campo
obrigatório" é responsabilidade do core, não do Pydantic.
"""
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AttackerIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    type1: Optional[str] = None
    type2: Optional[str] = None
    atk: Optional[float] = None
    sp_atk: Optional[float] = Field(None, alias="spAtk")
    stat_modifiers: Optional[Dict[str, float]] = Field(None, alias="statModifiers")


class MoveEffectIn(BaseModel):
    description: str


class MoveIn(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    power: Optional[float] = None
    effects: Optional[List[MoveEffectIn]] = None


class DefenderIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    type1: Optional[str] = None
    type2: Optional[str] = None
    def_: Optional[float] = Field(None, alias="def")
    sp_def: Optional[float] = Field(None, alias="spDef")
    stat_modifiers: Optional[Dict[str, float]] = Field(None, alias="statModifiers")


class BattleModifiersIn(BaseModel):
    critical: bool = False
    multiplier: Optional[float] = None


class DamageCalculateRequest(BaseModel):
    attacker: AttackerIn
    move: MoveIn
    defender: DefenderIn
    modifiers: BattleModifiersIn


class EffectiveStatDetailOut(BaseModel):
    original: float
    modification: float
    modified: float
    effective: float


class EffectiveStatsOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    atk: float
    def_: float = Field(alias="def")
    sp_atk: float = Field(alias="spAtk")
    sp_def: float = Field(alias="spDef")


class EffectivenessBreakdownEntryOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    defense_type: str = Field(alias="defenseType")
    multiplier: float


class DamageCalculateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_damaging_move: bool = Field(alias="isDamagingMove")
    base_damage: float = Field(alias="baseDamage")
    effective_attack: float = Field(alias="effectiveAttack")
    effective_defense: float = Field(alias="effectiveDefense")
    stab_multiplier: float = Field(alias="stabMultiplier")
    effectiveness_multiplier: float = Field(alias="effectivenessMultiplier")
    critical_multiplier: float = Field(alias="criticalMultiplier")
    other_multiplier: float = Field(alias="otherMultiplier")
    final_damage: float = Field(alias="finalDamage")
    effective_stats: EffectiveStatsOut = Field(alias="effectiveStats")
    attack_detail: EffectiveStatDetailOut = Field(alias="attackDetail")
    defense_detail: EffectiveStatDetailOut = Field(alias="defenseDetail")
    effectiveness_breakdown: List[EffectivenessBreakdownEntryOut] = Field(
        default_factory=list, alias="effectivenessBreakdown"
    )
