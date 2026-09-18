"""
POST /api/damage/calculate — Etapa 6, passo B.

Só orquestra: converte o request (já validado em FORMATO pelo Pydantic)
pros dataclasses do core, valida a REGRA DE NEGÓCIO com
app.core.validators.validate_battle_input, e devolve o DamageResult
serializado no formato camelCase acordado com o frontend.

Por que validar aqui em vez de deixar calculate_damage validar sozinho:
calculate_damage já valida internamente, mas relança só um ValueError
com uma string resumida se a entrada for inválida — perderíamos o
formato único {field, message} por campo usado pelo resto da API
(decisão aprovada da V3). Validando aqui primeiro, a validação interna
do calculate_damage nunca falha quando chegamos até ela.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.damage_calculator import calculate_damage
from app.core.models import Attacker, BattleModifiers, DamageInput, Defender, Move, MoveEffect
from app.core.validators import validate_battle_input
from app.schemas.damage import (
    DamageCalculateRequest,
    DamageCalculateResponse,
    EffectiveStatDetailOut,
    EffectivenessBreakdownEntryOut,
    EffectiveStatsOut,
)

router = APIRouter(prefix="/api/damage", tags=["damage"])


def _to_damage_input(payload: DamageCalculateRequest) -> DamageInput:
    return DamageInput(
        attacker=Attacker(
            type1=payload.attacker.type1,
            atk=payload.attacker.atk,
            sp_atk=payload.attacker.sp_atk,
            name=payload.attacker.name,
            type2=payload.attacker.type2,
            stat_modifiers=payload.attacker.stat_modifiers,
        ),
        move=Move(
            type=payload.move.type,
            category=payload.move.category,
            power=payload.move.power,
            name=payload.move.name,
            effects=(
                [MoveEffect(description=e.description) for e in payload.move.effects]
                if payload.move.effects
                else None
            ),
        ),
        defender=Defender(
            type1=payload.defender.type1,
            def_=payload.defender.def_,
            sp_def=payload.defender.sp_def,
            name=payload.defender.name,
            type2=payload.defender.type2,
            stat_modifiers=payload.defender.stat_modifiers,
        ),
        modifiers=BattleModifiers(
            critical=payload.modifiers.critical,
            multiplier=payload.modifiers.multiplier,
        ),
    )


@router.post("/calculate", response_model=DamageCalculateResponse)
def calculate(payload: DamageCalculateRequest):
    damage_input = _to_damage_input(payload)

    validation = validate_battle_input(damage_input)
    if not validation.valid:
        errors = [{"field": e.field, "message": e.message} for e in validation.errors]
        return JSONResponse(status_code=422, content={"errors": errors})

    result = calculate_damage(damage_input)

    return DamageCalculateResponse(
        is_damaging_move=result.is_damaging_move,
        base_damage=result.base_damage,
        effective_attack=result.effective_attack,
        effective_defense=result.effective_defense,
        stab_multiplier=result.stab_multiplier,
        effectiveness_multiplier=result.effectiveness_multiplier,
        critical_multiplier=result.critical_multiplier,
        other_multiplier=result.other_multiplier,
        final_damage=result.final_damage,
        effective_stats=EffectiveStatsOut(
            atk=result.effective_stats.atk,
            def_=result.effective_stats.def_,
            sp_atk=result.effective_stats.sp_atk,
            sp_def=result.effective_stats.sp_def,
        ),
        attack_detail=EffectiveStatDetailOut(
            original=result.attack_detail.original,
            modification=result.attack_detail.modification,
            modified=result.attack_detail.modified,
            effective=result.attack_detail.effective,
        ),
        defense_detail=EffectiveStatDetailOut(
            original=result.defense_detail.original,
            modification=result.defense_detail.modification,
            modified=result.defense_detail.modified,
            effective=result.defense_detail.effective,
        ),
        effectiveness_breakdown=[
            EffectivenessBreakdownEntryOut(defense_type=e.defense_type, multiplier=e.multiplier)
            for e in result.effectiveness_breakdown
        ],
    )
