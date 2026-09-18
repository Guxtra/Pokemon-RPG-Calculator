"""
validators — validação da entrada do motor de cálculo. Port 1:1 de
src/core/validators.ts.

O motor valida tudo o que recebe, inclusive vindo de outras origens que
não a interface (ex.: a API). A interface usa estas mesmas regras (via
o formato único {field, message} definido na camada HTTP) para exibir
mensagens amigáveis junto aos campos.

Decisão aprovada (V3, item 5): Pydantic só valida formato/estrutura;
toda regra de negócio (>= 0, tipos válidos, Tipo 2 != Tipo 1) vive
exclusivamente aqui — não duplicar em múltiplas camadas.
"""
import math
from dataclasses import dataclass, field
from numbers import Number
from typing import List, Optional

from app.core.models import DamageInput, MoveCategory, PokemonType
from app.core.type_catalog import TYPE_IDS

VALID_CATEGORIES: List[MoveCategory] = ["PHYSICAL", "SPECIAL"]


@dataclass
class ValidationError:
    field: str
    message: str


@dataclass
class ValidationResult:
    valid: bool
    errors: List[ValidationError] = field(default_factory=list)


def _is_number(value) -> bool:
    # bool é subclasse de int em Python; TS não trata boolean como number.
    return isinstance(value, Number) and not isinstance(value, bool)


def _validate_required_non_negative(value, field_label: str) -> Optional[str]:
    """Valida um valor numérico obrigatório e não negativo."""
    if value is None or value == "" or (isinstance(value, float) and math.isnan(value)):
        return f"Informe {field_label}."
    if not _is_number(value) or not math.isfinite(value):
        return f"{field_label} deve ser um número."
    if value < 0:
        return f"{field_label} deve ser um número maior ou igual a 0."
    return None


def _validate_optional_non_negative(value, field_label: str) -> Optional[str]:
    """Valida um valor numérico OPCIONAL (ausente é válido), mas se presente deve ser >= 0."""
    if value is None:
        return None
    if not _is_number(value) or (isinstance(value, float) and math.isnan(value)) or not math.isfinite(value):
        return f"{field_label} deve ser um número."
    if value < 0:
        return f"{field_label} deve ser um número maior ou igual a 0."
    return None


def _validate_type(value, field_label: str) -> Optional[str]:
    """Valida um tipo: obrigatório e pertencente aos 18 tipos válidos."""
    if not value:
        return f"{field_label} é obrigatório."
    if value not in TYPE_IDS:
        return f"{field_label} inválido."
    return None


def _validate_distinct_types(
    type1: Optional[PokemonType], type2: Optional[PokemonType], field_label: str
) -> Optional[str]:
    """Valida que um Tipo 2 opcional não seja idêntico ao Tipo 1."""
    if type1 and type2 and type1 == type2:
        return f"{field_label} não pode ser igual ao Tipo 1."
    return None


def validate_battle_input(input: DamageInput) -> ValidationResult:
    """
    Valida a entrada completa de um cálculo de dano.

    Regras cobertas: ATK/DEF/Sp.ATK/Sp.DEF/Poder >= 0; Modificador
    opcional mas >= 0 quando informado; tipos válidos e obrigatórios
    (Tipo 1 do atacante/defensor, tipo do golpe); categoria obrigatória
    e válida; Tipo 2 (atacante ou defensor) não pode repetir o Tipo 1.
    """
    errors: List[ValidationError] = []
    attacker, move, defender, modifiers = (
        input.attacker,
        input.move,
        input.defender,
        input.modifiers,
    )

    def push(field_name: str, message: Optional[str]) -> None:
        if message:
            errors.append(ValidationError(field=field_name, message=message))

    push("attacker.atk", _validate_required_non_negative(attacker.atk, "ATK"))
    push("attacker.spAtk", _validate_required_non_negative(attacker.sp_atk, "Sp. ATK"))
    push("defender.def", _validate_required_non_negative(defender.def_, "DEF"))
    push("defender.spDef", _validate_required_non_negative(defender.sp_def, "Sp. DEF"))
    push("move.power", _validate_required_non_negative(move.power, "Poder"))
    push(
        "modifiers.multiplier",
        _validate_optional_non_negative(modifiers.multiplier, "Modificador"),
    )

    push("attacker.type1", _validate_type(attacker.type1, "Tipo 1 do atacante"))
    push("move.type", _validate_type(move.type, "Tipo do golpe"))
    push("defender.type1", _validate_type(defender.type1, "Tipo 1 do defensor"))

    if not move.category:
        push("move.category", "Categoria do golpe é obrigatória.")
    elif move.category not in VALID_CATEGORIES:
        push("move.category", "Categoria do golpe inválida.")

    push(
        "attacker.type2",
        _validate_distinct_types(attacker.type1, attacker.type2, "Tipo 2 do atacante"),
    )
    push(
        "defender.type2",
        _validate_distinct_types(defender.type1, defender.type2, "Tipo 2 do defensor"),
    )

    return ValidationResult(valid=len(errors) == 0, errors=errors)
