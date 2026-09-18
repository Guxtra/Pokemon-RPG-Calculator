"""
GET /api/pokemon — lista os pokémon já sincronizados (Etapa 6, passo A).
GET /api/pokemon/{pokeapi_id}/stats — stats calculados pro nível pedido
(continuação da V3, pré-requisito do frontend: expõe via HTTP o service
já existente desde a Etapa 5, sem duplicar nenhuma lógica).
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.pokemon import Pokemon
from app.models.pokemon_species import PokemonSpecies
from app.schemas.pokemon import PokemonOut, PokemonStatsOut
from app.services.pokemon_service import PokemonServiceError, get_pokemon_stats

router = APIRouter(prefix="/api/pokemon", tags=["pokemon"])


def _to_pokemon_out(pokemon: Pokemon) -> PokemonOut:
    return PokemonOut(
        pokeapi_id=pokemon.pokeapi_id,
        name=pokemon.name,
        national_dex_number=pokemon.species.national_dex_number,
        type1=pokemon.type1.name,
        type2=pokemon.type2.name if pokemon.type2 else None,
        base_hp=pokemon.base_hp,
        base_atk=pokemon.base_atk,
        base_def=pokemon.base_def,
        base_sp_atk=pokemon.base_sp_atk,
        base_sp_def=pokemon.base_sp_def,
        base_speed=pokemon.base_speed,
    )


@router.get("", response_model=list[PokemonOut])
def list_pokemon(db: Session = Depends(get_db)) -> list[PokemonOut]:
    pokemons = (
        db.query(Pokemon)
        .join(Pokemon.species)
        .options(
            joinedload(Pokemon.species),
            joinedload(Pokemon.type1),
            joinedload(Pokemon.type2),
        )
        .order_by(PokemonSpecies.national_dex_number)
        .all()
    )
    return [_to_pokemon_out(p) for p in pokemons]


@router.get("/{pokeapi_id}/stats", response_model=PokemonStatsOut)
def get_pokemon_stats_by_level(pokeapi_id: int, level: int, db: Session = Depends(get_db)):
    """
    Stats calculados pro nível pedido. `level` é obrigatório (query
    param) — se não for um inteiro, o Pydantic/FastAPI já rejeita antes
    de chegar aqui, no formato único {errors: [{field, message}]}.

    PokemonServiceError pode significar duas coisas diferentes, e aqui
    é onde isso vira status HTTP: erro no campo "pokemon" (não
    encontrado) -> 404; erro no campo "level" (fora de 1-100) -> 422.
    Ambos no mesmo formato único do resto da API.
    """
    try:
        result = get_pokemon_stats(db, level, pokemon_id=pokeapi_id)
    except PokemonServiceError as exc:
        errors = [{"field": e.field, "message": e.message} for e in exc.errors]
        status_code = 404 if any(e.field == "pokemon" for e in exc.errors) else 422
        return JSONResponse(status_code=status_code, content={"errors": errors})

    return PokemonStatsOut(
        pokeapi_id=result.pokeapi_id,
        name=result.name,
        level=result.level,
        type1=result.type1,
        type2=result.type2,
        hp=result.hp,
        atk=result.atk,
        def_=result.def_,
        sp_atk=result.sp_atk,
        sp_def=result.sp_def,
        speed=result.speed,
    )
