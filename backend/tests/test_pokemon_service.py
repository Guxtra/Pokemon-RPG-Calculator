import pytest

from app.services.pokemon_service import PokemonServiceError, get_pokemon_stats


def test_get_stats_by_pokemon_id(db_session, pikachu):
    result = get_pokemon_stats(db_session, level=50, pokemon_id=25)

    assert result.name == "pikachu"
    assert result.type1 == "electric"
    assert result.type2 is None
    assert result.hp == 35  # base stat puro, sem fórmula
    assert result.speed == 90  # idem
    # Stat = floor(((2*Base+31)*Nível/100)+5) — conferido à parte no core (Etapa 3)
    assert result.atk == 75
    assert result.def_ == 60
    assert result.sp_atk == 70
    assert result.sp_def == 70


def test_get_stats_by_name_is_case_insensitive(db_session, pikachu):
    result = get_pokemon_stats(db_session, level=50, name="PIKACHU")
    assert result.pokeapi_id == 25


def test_pokemon_not_found_by_id(db_session):
    with pytest.raises(PokemonServiceError) as exc_info:
        get_pokemon_stats(db_session, level=50, pokemon_id=9999)
    assert exc_info.value.errors[0].field == "pokemon"


def test_pokemon_not_found_by_name(db_session):
    with pytest.raises(PokemonServiceError) as exc_info:
        get_pokemon_stats(db_session, level=50, name="does-not-exist")
    assert exc_info.value.errors[0].field == "pokemon"


@pytest.mark.parametrize("level", [0, -1, 101, 1000])
def test_level_out_of_range(db_session, pikachu, level):
    with pytest.raises(PokemonServiceError) as exc_info:
        get_pokemon_stats(db_session, level=level, pokemon_id=25)
    assert exc_info.value.errors[0].field == "level"


def test_level_must_be_int(db_session, pikachu):
    with pytest.raises(PokemonServiceError) as exc_info:
        get_pokemon_stats(db_session, level=50.5, pokemon_id=25)  # type: ignore[arg-type]
    assert exc_info.value.errors[0].field == "level"


def test_requires_exactly_one_identifier(db_session, pikachu):
    with pytest.raises(PokemonServiceError):
        get_pokemon_stats(db_session, level=50)  # nem pokemon_id nem name

    with pytest.raises(PokemonServiceError):
        get_pokemon_stats(db_session, level=50, pokemon_id=25, name="pikachu")  # os dois
