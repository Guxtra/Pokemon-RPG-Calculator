"""etapa 2: tabelas de dominio (generation, type, pokemon_species, pokemon, move)

Revision ID: 2c716490d385
Revises: 5f4b33a2d810
Create Date: 2026-09-11 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "2c716490d385"
down_revision: Union[str, None] = "5f4b33a2d810"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generation",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokeapi_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.UniqueConstraint("pokeapi_id", name="uq_generation_pokeapi_id"),
        sa.UniqueConstraint("order", name="uq_generation_order"),
    )
    op.create_index("ix_generation_pokeapi_id", "generation", ["pokeapi_id"])

    op.create_table(
        "type",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokeapi_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=20), nullable=False),
        sa.UniqueConstraint("pokeapi_id", name="uq_type_pokeapi_id"),
        sa.UniqueConstraint("name", name="uq_type_name"),
    )
    op.create_index("ix_type_pokeapi_id", "type", ["pokeapi_id"])

    op.create_table(
        "pokemon_species",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokeapi_id", sa.Integer(), nullable=False),
        sa.Column("national_dex_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("generation_id", sa.Integer(), nullable=False),
        sa.Column("is_legendary", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_mythical", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(
            ["generation_id"], ["generation.id"], name="fk_pokemon_species_generation_id"
        ),
        sa.UniqueConstraint("pokeapi_id", name="uq_pokemon_species_pokeapi_id"),
    )
    op.create_index("ix_pokemon_species_pokeapi_id", "pokemon_species", ["pokeapi_id"])
    op.create_index(
        "ix_pokemon_species_national_dex_number", "pokemon_species", ["national_dex_number"]
    )

    move_category = sa.Enum("PHYSICAL", "SPECIAL", name="move_category")

    op.create_table(
        "pokemon",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokeapi_id", sa.Integer(), nullable=False),
        sa.Column("species_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("type1_id", sa.Integer(), nullable=False),
        sa.Column("type2_id", sa.Integer(), nullable=True),
        sa.Column("base_hp", sa.Integer(), nullable=False),
        sa.Column("base_atk", sa.Integer(), nullable=False),
        sa.Column("base_def", sa.Integer(), nullable=False),
        sa.Column("base_sp_atk", sa.Integer(), nullable=False),
        sa.Column("base_sp_def", sa.Integer(), nullable=False),
        sa.Column("base_speed", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["species_id"], ["pokemon_species.id"], name="fk_pokemon_species_id"
        ),
        sa.ForeignKeyConstraint(["type1_id"], ["type.id"], name="fk_pokemon_type1_id"),
        sa.ForeignKeyConstraint(["type2_id"], ["type.id"], name="fk_pokemon_type2_id"),
        sa.UniqueConstraint("pokeapi_id", name="uq_pokemon_pokeapi_id"),
    )
    op.create_index("ix_pokemon_pokeapi_id", "pokemon", ["pokeapi_id"])

    op.create_table(
        "move",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokeapi_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("type_id", sa.Integer(), nullable=False),
        sa.Column("power", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("category", move_category, nullable=False),
        sa.Column("pokeapi_damage_class", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(["type_id"], ["type.id"], name="fk_move_type_id"),
        sa.UniqueConstraint("pokeapi_id", name="uq_move_pokeapi_id"),
    )
    op.create_index("ix_move_pokeapi_id", "move", ["pokeapi_id"])


def downgrade() -> None:
    op.drop_table("move")
    op.drop_table("pokemon")
    op.drop_table("pokemon_species")
    op.drop_table("type")
    op.drop_table("generation")
    sa.Enum(name="move_category").drop(op.get_bind(), checkfirst=True)
