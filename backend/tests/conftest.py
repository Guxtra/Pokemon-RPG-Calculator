"""
Fixtures compartilhadas dos testes. db_session usa SQLite em memória —
não precisa do Postgres do Docker rodando para os testes de service.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Importa app.models (não só app.database) para que todos os models
# fiquem registrados em Base.metadata antes do create_all abaixo.
from app.database import Base, get_db
from app.main import app
from app.models import Generation, Move, MoveCategory, Pokemon, PokemonSpecies, Type


@pytest.fixture()
def db_session():
    # StaticPool + check_same_thread=False: o TestClient roda os endpoints
    # numa thread diferente da do teste, e SQLite ":memory:" por padrão
    # cria um banco novo por conexão/thread — sem isso, a rota veria um
    # banco vazio (e o SQLite trava ao reusar a conexão entre threads).
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session: Session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def pikachu(db_session: Session) -> Pokemon:
    """Cria um Pikachu mínimo (stats reais de Kanto) já persistido."""
    generation = Generation(pokeapi_id=1, name="generation-i", order=1)
    electric = Type(pokeapi_id=13, name="electric")
    db_session.add_all([generation, electric])
    db_session.flush()

    species = PokemonSpecies(
        pokeapi_id=25,
        national_dex_number=25,
        name="pikachu",
        generation_id=generation.id,
    )
    db_session.add(species)
    db_session.flush()

    pokemon = Pokemon(
        pokeapi_id=25,
        species_id=species.id,
        name="pikachu",
        is_default=True,
        type1_id=electric.id,
        type2_id=None,
        base_hp=35,
        base_atk=55,
        base_def=40,
        base_sp_atk=50,
        base_sp_def=50,
        base_speed=90,
    )
    db_session.add(pokemon)
    db_session.commit()
    return pokemon


@pytest.fixture()
def thunderbolt(db_session: Session) -> Move:
    """Cria um golpe especial mínimo (Thunderbolt), independente da fixture pikachu."""
    electric = db_session.query(Type).filter_by(name="electric").one_or_none()
    if electric is None:
        electric = Type(pokeapi_id=13, name="electric")
        db_session.add(electric)
        db_session.flush()

    move = Move(
        pokeapi_id=85,
        name="thunderbolt",
        type_id=electric.id,
        power=90,
        category=MoveCategory.SPECIAL,
        pokeapi_damage_class="special",
    )
    db_session.add(move)
    db_session.commit()
    return move


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """TestClient da API com get_db trocado pelo mesmo SQLite em memória do teste."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
