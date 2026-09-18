def _valid_payload(**overrides):
    payload = {
        "attacker": {"type1": "fire", "atk": 100, "spAtk": 80},
        "move": {"type": "fire", "category": "PHYSICAL", "power": 90},
        "defender": {"type1": "water", "def": 70, "spDef": 60},
        "modifiers": {"critical": False},
    }
    payload.update(overrides)
    return payload


def test_calculate_damage_happy_path(client):
    response = client.post("/api/damage/calculate", json=_valid_payload())

    assert response.status_code == 200
    body = response.json()

    # Fogo vs Água = não muito efetivo (0.5x); sem STAB pro golpe físico
    # com tipo igual ao atacante -> tem STAB (fire/fire) = 1.5x.
    assert body["isDamagingMove"] is True
    assert body["stabMultiplier"] == 1.5
    assert body["effectivenessMultiplier"] == 0.5
    assert body["finalDamage"] > 0
    assert "effectiveStats" in body
    assert "effectivenessBreakdown" in body


def test_calculate_damage_status_move_has_no_damage(client):
    payload = _valid_payload(move={"type": "normal", "category": "PHYSICAL", "power": 0})
    response = client.post("/api/damage/calculate", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["isDamagingMove"] is False
    assert body["finalDamage"] == 0


def test_calculate_damage_missing_required_field_returns_structured_errors(client):
    payload = _valid_payload()
    del payload["attacker"]["atk"]

    response = client.post("/api/damage/calculate", json=payload)

    assert response.status_code == 422
    errors = response.json()["errors"]
    assert any(e["field"] == "attacker.atk" for e in errors)


def test_calculate_damage_invalid_type_returns_structured_error(client):
    payload = _valid_payload()
    payload["attacker"]["type1"] = "not-a-real-type"

    response = client.post("/api/damage/calculate", json=payload)

    assert response.status_code == 422
    errors = response.json()["errors"]
    assert any(e["field"] == "attacker.type1" for e in errors)


def test_calculate_damage_duplicate_type2_returns_structured_error(client):
    payload = _valid_payload()
    payload["attacker"]["type1"] = "fire"
    payload["attacker"]["type2"] = "fire"

    response = client.post("/api/damage/calculate", json=payload)

    assert response.status_code == 422
    errors = response.json()["errors"]
    assert any(e["field"] == "attacker.type2" for e in errors)


def test_calculate_damage_malformed_json_uses_pydantic_error_format(client):
    payload = _valid_payload()
    payload["attacker"]["atk"] = "not-a-number"

    response = client.post("/api/damage/calculate", json=payload)

    assert response.status_code == 422
    assert "errors" in response.json()
