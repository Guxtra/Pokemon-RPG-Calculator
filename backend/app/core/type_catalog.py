"""Catálogo dos 18 tipos modernos — port 1:1 de src/data/types.ts."""
from app.core.models import PokemonType

TYPE_IDS: list[PokemonType] = [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
]

TYPE_LABELS: dict[PokemonType, str] = {t: t.capitalize() for t in TYPE_IDS}
