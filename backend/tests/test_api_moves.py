def test_list_moves_returns_seeded_moves(client, thunderbolt):
    response = client.get("/api/moves")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1

    entry = body[0]
    assert entry["pokeapi_id"] == 85
    assert entry["name"] == "thunderbolt"
    assert entry["type"] == "electric"
    assert entry["power"] == 90
    assert entry["category"] == "SPECIAL"


def test_list_moves_empty_when_no_data(client):
    response = client.get("/api/moves")

    assert response.status_code == 200
    assert response.json() == []
