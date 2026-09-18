def test_list_pokemon_returns_seeded_pokemon(client, pikachu):
    response = client.get("/api/pokemon")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1

    entry = body[0]
    assert entry["pokeapi_id"] == 25
    assert entry["name"] == "pikachu"
    assert entry["national_dex_number"] == 25
    assert entry["type1"] == "electric"
    assert entry["type2"] is None
    assert entry["base_hp"] == 35
    assert entry["base_speed"] == 90


def test_list_pokemon_empty_when_no_data(client):
    response = client.get("/api/pokemon")

    assert response.status_code == 200
    assert response.json() == []


def test_get_stats_happy_path(client, pikachu):
    response = client.get("/api/pokemon/25/stats", params={"level": 50})

    assert response.status_code == 200
    body = response.json()
    assert body["pokeapiId"] == 25
    assert body["name"] == "pikachu"
    assert body["level"] == 50
    assert body["type1"] == "electric"
    assert body["type2"] is None
    assert body["hp"] == 35  # base stat puro
    assert body["speed"] == 90  # base stat puro
    assert body["atk"] == 75
    assert body["def"] == 60
    assert body["spAtk"] == 70
    assert body["spDef"] == 70


def test_get_stats_pokemon_not_found_returns_404(client):
    response = client.get("/api/pokemon/9999/stats", params={"level": 50})

    assert response.status_code == 404
    errors = response.json()["errors"]
    assert errors[0]["field"] == "pokemon"


def test_get_stats_level_out_of_range_returns_422(client, pikachu):
    response = client.get("/api/pokemon/25/stats", params={"level": 0})

    assert response.status_code == 422
    errors = response.json()["errors"]
    assert errors[0]["field"] == "level"


def test_get_stats_missing_level_query_param(client, pikachu):
    response = client.get("/api/pokemon/25/stats")

    assert response.status_code == 422
    assert "errors" in response.json()


def test_get_stats_malformed_level_query_param(client, pikachu):
    response = client.get("/api/pokemon/25/stats", params={"level": "not-a-number"})

    assert response.status_code == 422
    assert "errors" in response.json()
