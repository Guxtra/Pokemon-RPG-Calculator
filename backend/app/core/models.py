"""
Modelos de domínio do motor de cálculo — port 1:1 de src/core/models.ts
(TypeScript, V2). O motor não depende de FastAPI, SQLAlchemy nem de
nenhuma camada de persistência: recebe e devolve apenas estes objetos.

Nota sobre nomes: `def` é palavra reservada em Python, então os campos
correspondentes usam `def_` (ex.: Defender.def_). O contrato de rede
(chaves JSON/campos de erro) continua usando "def" — essa tradução
acontece na camada de schemas (Pydantic), não aqui no core.

Os dicionários `stat_modifiers` usam as MESMAS chaves camelCase que o
frontend já envia (ex.: {"atk": 5, "spAtk": 0}) — não uma chave por
model Python — para casar exatamente com o contrato JSON existente.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# Os 18 tipos modernos do RPG (dados em type_catalog.py / type_chart.py).
PokemonType = str

# "PHYSICAL" | "SPECIAL" — determina quais atributos entram na divisão.
MoveCategory = str


@dataclass
class Attacker:
    type1: PokemonType
    atk: float
    sp_atk: float
    name: Optional[str] = None
    type2: Optional[PokemonType] = None
    stat_modifiers: Optional[Dict[str, float]] = None


@dataclass
class MoveEffect:
    """Efeito de um movimento (V1: estrutura mínima, sem resolução automática)."""

    description: str


@dataclass
class Move:
    type: PokemonType
    category: MoveCategory
    power: float
    name: Optional[str] = None
    effects: Optional[List[MoveEffect]] = None


@dataclass
class Defender:
    type1: PokemonType
    def_: float
    sp_def: float
    name: Optional[str] = None
    type2: Optional[PokemonType] = None
    stat_modifiers: Optional[Dict[str, float]] = None


@dataclass
class BattleModifiers:
    critical: bool
    multiplier: Optional[float] = None


@dataclass
class DamageInput:
    attacker: Attacker
    move: Move
    defender: Defender
    modifiers: BattleModifiers


@dataclass
class EffectiveStats:
    atk: float
    def_: float
    sp_atk: float
    sp_def: float


@dataclass
class EffectiveStatDetail:
    original: float
    modification: float
    modified: float
    effective: float


@dataclass
class EffectivenessBreakdownEntry:
    defense_type: PokemonType
    multiplier: float


@dataclass
class DamageResult:
    is_damaging_move: bool

    base_damage: float
    effective_attack: float
    effective_defense: float

    stab_multiplier: float
    effectiveness_multiplier: float
    critical_multiplier: float
    other_multiplier: float

    final_damage: float

    effective_stats: EffectiveStats
    attack_detail: EffectiveStatDetail
    defense_detail: EffectiveStatDetail

    effectiveness_breakdown: List[EffectivenessBreakdownEntry] = field(default_factory=list)
