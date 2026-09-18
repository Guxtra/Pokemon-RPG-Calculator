"""
Ponto de entrada da aplicação.

Infraestrutura (CORS, health check, formato de erro unificado) +
routers de domínio em app/api/. Etapa 6 completa: pokemon, moves
(listagens simples) e damage (POST /api/damage/calculate, usa
app.core.validators + app.core.damage_calculator).
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.damage import router as damage_router
from app.api.moves import router as moves_router
from app.api.pokemon import router as pokemon_router
from app.config import settings
from app.database import SessionLocal

app = FastAPI(title="Pokémon RPG Calculator API")
app.include_router(pokemon_router)
app.include_router(moves_router)
app.include_router(damage_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Converte o formato nativo de erro do Pydantic/FastAPI para o formato
    único acordado com o frontend: uma lista de {field, message}.

    Pydantic usa `loc` (uma tupla como ("body", "attacker", "atk")) — aqui
    ela é reduzida ao nome do campo mais específico, ignorando "body".
    Erros de regra de negócio (validate_battle_input, a partir da Etapa 3)
    devem ser lançados já nesse mesmo formato, para que o frontend nunca
    precise tratar dois formatos diferentes de erro.
    """
    errors = [
        {
            "field": ".".join(str(part) for part in error["loc"] if part != "body"),
            "message": error["msg"],
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"errors": errors})


@app.get("/health")
def health_check() -> dict:
    """
    Confirma que o processo está de pé E que a conexão com o Postgres
    funciona (faz um SELECT 1 de verdade, não só responde "ok" fixo).
    """
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unreachable"
    finally:
        db.close()

    return {"status": "ok", "database": db_status, "environment": settings.environment}
