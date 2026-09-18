"""
Importa todos os models para que fiquem registrados em Base.metadata —
necessário para o Alembic (autogenerate) e para o SQLAlchemy resolver
os relacionamentos declarados como string (ex.: "PokemonSpecies").
"""
from app.models.generation import Generation
from app.models.type_ import Type
from app.models.pokemon_species import PokemonSpecies
from app.models.pokemon import Pokemon
from app.models.move import Move, MoveCategory

__all__ = [
    "Generation",
    "Type",
    "PokemonSpecies",
    "Pokemon",
    "Move",
    "MoveCategory",
]
