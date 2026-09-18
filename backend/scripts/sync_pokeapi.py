"""
Script de sincronização do catálogo (generation, type, pokemon_species,
pokemon, move) a partir do dump estático do repositório PokeAPI/api-data.

Não usa a API ao vivo (decisão aprovada) — lê arquivos JSON já baixados
localmente. Antes de rodar, clone o dump (fora da pasta do projeto, ele
é grande):

    git clone --depth 1 https://github.com/PokeAPI/api-data.git

Uso (de dentro de backend\\, com o venv ativado):

    .venv\\Scripts\\python.exe -m scripts.sync_pokeapi --data-path <caminho do clone> --max-generation 1

--data-path aceita tanto a raiz do clone quanto a pasta data/api/v2
dentro dele.

Idempotente: cada tabela usa pokeapi_id como chave de upsert (UNIQUE já
garantido pelo schema — decisão 5), então rodar de novo atualiza os
registros existentes em vez de duplicá-los.

Tipos (decisão de escopo desta etapa): sincronizamos TODOS os tipos
existentes no dump, independente de --max-generation — a tabela type é
pequena e não há motivo para filtrá-la por geração.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.generation import Generation
from app.models.move import Move, MoveCategory
from app.models.pokemon import Pokemon
from app.models.pokemon_species import PokemonSpecies
from app.models.type_ import Type


def resolve_v2_root(data_path: Path) -> Path:
    """Aceita tanto a raiz do repo clonado quanto a pasta data/api/v2 diretamente."""
    candidate = data_path / "data" / "api" / "v2"
    if candidate.is_dir():
        return candidate
    if (data_path / "generation").is_dir():
        return data_path
    raise FileNotFoundError(
        f"Não encontrei a estrutura data/api/v2 em {data_path}. "
        "Aponte --data-path para a raiz do clone do PokeAPI/api-data "
        "(ou para a pasta data/api/v2 dentro dele)."
    )


def load_resource(v2_root: Path, resource: str, resource_id: int) -> dict:
    path = v2_root / resource / str(resource_id) / "index.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def iter_resource_ids(v2_root: Path, resource: str) -> list[int]:
    """Lista os ids disponíveis de um recurso a partir das subpastas numéricas."""
    resource_dir = v2_root / resource
    return sorted(int(p.name) for p in resource_dir.iterdir() if p.is_dir() and p.name.isdigit())


def _extract_id_from_url(url: str | None) -> int | None:
    """PokéAPI sempre termina as urls de recurso em /<id>/ — extrai esse id."""
    if not url:
        return None
    parts = [p for p in url.rstrip("/").split("/") if p]
    try:
        return int(parts[-1])
    except (ValueError, IndexError):
        return None


def sync_generations(db: Session, v2_root: Path, max_generation: int) -> dict[int, int]:
    """Sincroniza generation 1..max_generation. Retorna {pokeapi_id: db_id}."""
    id_map: dict[int, int] = {}
    for gen_id in range(1, max_generation + 1):
        data = load_resource(v2_root, "generation", gen_id)
        row = db.query(Generation).filter_by(pokeapi_id=gen_id).one_or_none()
        if row is None:
            row = Generation(pokeapi_id=gen_id)
            db.add(row)
        row.name = data["name"]
        row.order = gen_id  # generation-i..generation-ix já são sequenciais == id
        db.flush()
        id_map[gen_id] = row.id
    db.commit()
    print(f"[generation] {len(id_map)} sincronizadas")
    return id_map


def sync_types(db: Session, v2_root: Path) -> dict[int, int]:
    """Sincroniza todos os tipos do dump (ver nota de escopo no topo do arquivo)."""
    id_map: dict[int, int] = {}
    for type_id in iter_resource_ids(v2_root, "type"):
        data = load_resource(v2_root, "type", type_id)
        name = data.get("name")
        if not name:
            # A PokéAPI tem alguns pseudo-tipos internos (ex.: "unknown",
            # "shadow") sem nome usável para o catálogo — ignorados.
            continue
        row = db.query(Type).filter_by(pokeapi_id=type_id).one_or_none()
        if row is None:
            row = Type(pokeapi_id=type_id)
            db.add(row)
        row.name = name
        db.flush()
        id_map[type_id] = row.id
    db.commit()
    print(f"[type] {len(id_map)} sincronizados")
    return id_map


def _national_dex_number(species_data: dict) -> int | None:
    for entry in species_data.get("pokedex_numbers", []):
        if entry.get("pokedex", {}).get("name") == "national":
            return entry["entry_number"]
    return None


def sync_species(
    db: Session,
    v2_root: Path,
    generation_ids: set[int],
    generation_id_map: dict[int, int],
) -> dict[int, int]:
    """Sincroniza pokemon_species cuja geração esteja no conjunto sincronizado."""
    id_map: dict[int, int] = {}
    count = 0
    for species_id in iter_resource_ids(v2_root, "pokemon-species"):
        data = load_resource(v2_root, "pokemon-species", species_id)
        gen_id = _extract_id_from_url(data.get("generation", {}).get("url"))
        if gen_id not in generation_ids:
            continue
        dex_number = _national_dex_number(data)
        if dex_number is None:
            continue

        row = db.query(PokemonSpecies).filter_by(pokeapi_id=species_id).one_or_none()
        if row is None:
            row = PokemonSpecies(pokeapi_id=species_id)
            db.add(row)
        row.name = data["name"]
        row.national_dex_number = dex_number
        row.generation_id = generation_id_map[gen_id]
        row.is_legendary = data.get("is_legendary", False)
        row.is_mythical = data.get("is_mythical", False)
        db.flush()
        id_map[species_id] = row.id
        count += 1
        if count % 50 == 0:
            db.commit()
            print(f"[pokemon_species] {count} sincronizadas...")
    db.commit()
    print(f"[pokemon_species] {len(id_map)} sincronizadas (total)")
    return id_map


def sync_pokemon(
    db: Session,
    v2_root: Path,
    species_id_map: dict[int, int],
    type_id_map: dict[int, int],
) -> set[int]:
    """Sincroniza pokemon (variedades) com is_default=True cuja species já foi sincronizada."""
    synced_ids: set[int] = set()
    count = 0
    for pokemon_id in iter_resource_ids(v2_root, "pokemon"):
        data = load_resource(v2_root, "pokemon", pokemon_id)
        if not data.get("is_default", False):
            continue
        species_pokeapi_id = _extract_id_from_url(data.get("species", {}).get("url"))
        if species_pokeapi_id not in species_id_map:
            continue

        types = data.get("types", [])
        type1 = next((t for t in types if t["slot"] == 1), None)
        type2 = next((t for t in types if t["slot"] == 2), None)
        if type1 is None:
            continue
        type1_pokeapi_id = _extract_id_from_url(type1["type"]["url"])
        type2_pokeapi_id = _extract_id_from_url(type2["type"]["url"]) if type2 else None
        if type1_pokeapi_id not in type_id_map:
            continue

        stats_by_name = {s["stat"]["name"]: s["base_stat"] for s in data.get("stats", [])}

        row = db.query(Pokemon).filter_by(pokeapi_id=pokemon_id).one_or_none()
        if row is None:
            row = Pokemon(pokeapi_id=pokemon_id)
            db.add(row)
        row.species_id = species_id_map[species_pokeapi_id]
        row.name = data["name"]
        row.is_default = True
        row.type1_id = type_id_map[type1_pokeapi_id]
        row.type2_id = type_id_map.get(type2_pokeapi_id) if type2_pokeapi_id else None
        row.base_hp = stats_by_name.get("hp", 0)
        row.base_atk = stats_by_name.get("attack", 0)
        row.base_def = stats_by_name.get("defense", 0)
        row.base_sp_atk = stats_by_name.get("special-attack", 0)
        row.base_sp_def = stats_by_name.get("special-defense", 0)
        row.base_speed = stats_by_name.get("speed", 0)
        db.flush()
        synced_ids.add(pokemon_id)
        count += 1
        if count % 50 == 0:
            db.commit()
            print(f"[pokemon] {count} sincronizados...")
    db.commit()
    print(f"[pokemon] {len(synced_ids)} sincronizados (total)")
    return synced_ids


def sync_moves(
    db: Session,
    v2_root: Path,
    generation_ids: set[int],
    type_id_map: dict[int, int],
) -> int:
    """Sincroniza moves cuja geração esteja no conjunto sincronizado."""
    count = 0
    for move_id in iter_resource_ids(v2_root, "move"):
        data = load_resource(v2_root, "move", move_id)
        gen_id = _extract_id_from_url(data.get("generation", {}).get("url"))
        if gen_id not in generation_ids:
            continue
        type_pokeapi_id = _extract_id_from_url(data.get("type", {}).get("url"))
        if type_pokeapi_id not in type_id_map:
            continue

        # Decisão 4: golpes de status (sem dano) viram PHYSICAL/power=0 por
        # convenção; o damage_class original da PokéAPI é preservado à parte.
        pokeapi_damage_class = data.get("damage_class", {}).get("name") or "status"
        category = (
            MoveCategory.SPECIAL if pokeapi_damage_class == "special" else MoveCategory.PHYSICAL
        )
        power = data.get("power") or 0

        row = db.query(Move).filter_by(pokeapi_id=move_id).one_or_none()
        if row is None:
            row = Move(pokeapi_id=move_id)
            db.add(row)
        row.name = data["name"]
        row.type_id = type_id_map[type_pokeapi_id]
        row.power = power
        row.category = category
        row.pokeapi_damage_class = pokeapi_damage_class
        db.flush()
        count += 1
        if count % 50 == 0:
            db.commit()
            print(f"[move] {count} sincronizados...")
    db.commit()
    print(f"[move] {count} sincronizados (total)")
    return count


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sincroniza o catálogo com o dump estático PokeAPI/api-data."
    )
    parser.add_argument(
        "--data-path",
        required=True,
        type=Path,
        help="Caminho do clone do repo PokeAPI/api-data (raiz do clone ou pasta data/api/v2).",
    )
    parser.add_argument(
        "--max-generation",
        type=int,
        default=1,
        help=(
            "Sincroniza generation, pokemon_species, pokemon e move até esta "
            "geração (inclusive). Default: 1 (Kanto)."
        ),
    )
    args = parser.parse_args()

    v2_root = resolve_v2_root(args.data_path)
    generation_range = set(range(1, args.max_generation + 1))

    db = SessionLocal()
    try:
        generation_id_map = sync_generations(db, v2_root, args.max_generation)
        type_id_map = sync_types(db, v2_root)
        species_id_map = sync_species(db, v2_root, generation_range, generation_id_map)
        sync_pokemon(db, v2_root, species_id_map, type_id_map)
        sync_moves(db, v2_root, generation_range, type_id_map)
    finally:
        db.close()


if __name__ == "__main__":
    main()
