"""
GET /api/moves — lista os golpes já sincronizados (Etapa 6, passo A).

Mesma lógica do router de pokemon: listagem simples, sem service.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.move import Move
from app.schemas.move import MoveOut

router = APIRouter(prefix="/api/moves", tags=["moves"])


def _to_move_out(move: Move) -> MoveOut:
    return MoveOut(
        pokeapi_id=move.pokeapi_id,
        name=move.name,
        type=move.type.name,
        power=move.power,
        category=move.category.value,
    )


@router.get("", response_model=list[MoveOut])
def list_moves(db: Session = Depends(get_db)) -> list[MoveOut]:
    moves = db.query(Move).options(joinedload(Move.type)).order_by(Move.name).all()
    return [_to_move_out(m) for m in moves]
