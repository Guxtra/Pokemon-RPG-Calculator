"""etapa 1: setup inicial (sem tabelas de dominio ainda)

Revision ID: 5f4b33a2d810
Revises:
Create Date: 2026-09-09 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "5f4b33a2d810"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Intencionalmente vazia: esta migration só existe para validar que o
    # Alembic consegue se conectar ao Postgres e registrar sua tabela de
    # controle (alembic_version). As tabelas de dominio (generation, type,
    # pokemon_species, pokemon, move) entram na Etapa 2.
    pass


def downgrade() -> None:
    pass
