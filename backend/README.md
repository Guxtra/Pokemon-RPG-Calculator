# Backend — Pokémon RPG Calculator (V3)

FastAPI + SQLAlchemy (síncrono) + PostgreSQL + Alembic.

Esta é a Etapa 1: só infraestrutura. Ainda não existe nenhuma tabela nem
regra de domínio — isso vem nas próximas etapas.

## 1. Banco de dados local (Docker)

```bash
docker run --name pokemon-rpg-db \
  -e POSTGRES_USER=pokemon \
  -e POSTGRES_PASSWORD=pokemon \
  -e POSTGRES_DB=pokemon_rpg \
  -p 5432:5432 \
  -d postgres:16
```

Para parar/religar depois: `docker stop pokemon-rpg-db` / `docker start pokemon-rpg-db`.

## 2. Ambiente virtual

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

No VS Code: abra a pasta `backend/`, rode `Python: Select Interpreter` (Ctrl+Shift+P)
e escolha o `.venv` criado acima — o VS Code passa a rodar/depurar já com as
dependências certas.

## 3. Variáveis de ambiente

```bash
cp .env.example .env
```

Os valores padrão do `.env.example` já batem com o comando Docker acima —
não precisa editar nada para rodar localmente.

## 4. Migrations

```bash
alembic upgrade head
```

Isso cria a tabela de controle do Alembic no banco (ainda sem tabelas de
domínio — só valida que a conexão está funcionando).

## 5. Rodar o servidor

```bash
uvicorn app.main:app --reload --port 8000
```

## 6. Validar

```bash
curl http://localhost:8000/health
```

Esperado:
```json
{"status": "ok", "database": "ok", "environment": "development"}
```

Se `"database"` vier como `"unreachable"`, o Postgres não está acessível
com a `DATABASE_URL` configurada — confira se o container Docker está no ar
(`docker ps`).

## Etapa 2 — tabelas de domínio

As 5 tabelas (`generation`, `type`, `pokemon_species`, `pokemon`, `move`) já
estão modeladas em `app/models/` e a migration já foi escrita à mão em
`migrations/versions/2c716490d385_etapa_2_tabelas_dominio.py`.

Para aplicá-la (com o venv já instalado da Etapa 1):

```bash
.venv\Scripts\python.exe -m alembic upgrade head
```

Para conferir que as 5 tabelas foram criadas, conecte no banco (ex.: com
`psql` ou qualquer cliente gráfico) e rode:

```sql
\dt
```

Ou, sem sair do terminal:

```bash
docker exec -it pokemon-rpg-db psql -U pokemon -d pokemon_rpg -c "\dt"
```

Esperado: `generation`, `type`, `pokemon_species`, `pokemon`, `move` e
`alembic_version` (tabela de controle do próprio Alembic).

## Etapa 3 — core de cálculo portado para Python

O motor foi portado 1:1 de TypeScript para `app/core/` (decisão 3/21 da
V3 — Python passa a ser a fonte da verdade do cálculo). Os 32 testes da
V2 foram portados para `tests/test_damage_calculator.py`, e a fórmula de
stats por nível ganhou sua própria função isolada e testada em
`app/core/stats.py` / `tests/test_pokemon_stats.py` (decisão 6/14).

Para rodar os testes (com o venv da Etapa 1 já instalado):

```
.venv\Scripts\python.exe -m pytest
```

Esperado: `38 passed` (32 do motor + 6 da fórmula de stats), sem
nenhuma falha.

O core ainda não está conectado a nenhum endpoint HTTP — isso é a
Etapa 6 (`POST /api/damage/calculate`). Por enquanto ele só existe e
está testado, isolado do resto do backend.

## Próximas etapas

- Etapa 4: script de sincronização com o dump estático da PokéAPI.
- Etapa 5/6: `services/` (stats por nível usando o core) + endpoints
  `GET /api/pokemon`, `GET /api/moves`, `POST /api/damage/calculate`.
