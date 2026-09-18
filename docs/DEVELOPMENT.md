# Desenvolvimento local — Pokémon RPG Calculator V3

Guia para rodar o projeto inteiro (frontend + backend + banco) na sua
máquina. Ambiente de referência: Windows + PowerShell + VS Code.

## Requisitos

- Node.js (para o frontend — React/Vite)
- Python 3.14
- Docker Desktop (para o PostgreSQL local)
- Git

## 1. Banco de dados (Docker)

Com o Docker Desktop aberto:

```powershell
docker run --name pokemon-rpg-db `
  -e POSTGRES_USER=pokemon `
  -e POSTGRES_PASSWORD=pokemon `
  -e POSTGRES_DB=pokemon_rpg `
  -p 5432:5432 `
  -d postgres:16
```

Da próxima vez, não precisa recriar — só religar:

```powershell
docker start pokemon-rpg-db
```

## 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Não existe `Activate.ps1` funcional garantido neste ambiente — chame
sempre o Python de dentro do venv diretamente:
`.venv\Scripts\python.exe -m <comando>`.

### Variáveis de ambiente

```powershell
copy .env.example .env
```

Os valores padrão já batem com o comando Docker acima — não precisa
editar nada pra rodar localmente.

### Migrations

```powershell
.venv\Scripts\python.exe -m alembic upgrade head
```

Cria as 5 tabelas (`generation`, `type`, `pokemon_species`, `pokemon`,
`move`).

### Sincronizar o catálogo da PokéAPI

Só precisa fazer uma vez (ou quando quiser atualizar). Primeiro clone
o dump estático (fora da pasta do projeto, ou em `backend/api-data/` —
não reclone se a pasta já existir):

```powershell
git clone --depth 1 https://github.com/PokeAPI/api-data.git
```

Depois rode o script (de dentro de `backend/`):

```powershell
.venv\Scripts\python.exe -m scripts.sync_pokeapi --data-path api-data --max-generation 9
```

Esperado: 9 gerações, 21 tipos, 1025 espécies, 1025 pokémon, 937
golpes. O script é idempotente — rodar de novo não duplica nada.

### Rodar o servidor

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Validar

```powershell
curl http://localhost:8000/health
```

Esperado: `{"status":"ok","database":"ok",...}`. Se `"database"` vier
diferente de `"ok"`, confira se o container Docker está no ar
(`docker ps`).

### Testes, typecheck

```powershell
.venv\Scripts\python.exe -m pytest
```

Esperado: `63 passed`.

## 3. Frontend

Em outro terminal, na raiz do projeto (não em `backend/`):

```powershell
npm install
copy .env.example .env
npm run dev
```

Abre o endereço mostrado no terminal (geralmente `http://localhost:5173`).
Precisa do backend rodando (passo 2) para os modos Catálogo e para o
cálculo de dano funcionarem — sem ele, o app ainda abre normalmente,
só cai para os avisos de "não consegui carregar o catálogo".

### Testes, typecheck, lint, build

```powershell
npm test           # Vitest — esperado: 49 passed
npm run typecheck  # tsc -b --noEmit — esperado: sem erros
npm run lint        # oxlint
npm run build        # gera dist/
```

## Referência rápida — recriando o banco do zero

Se o container do Postgres for apagado (por acidente ou de propósito),
os dados vão junto. Pra recriar:

1. Passo 1 deste guia (recriar o container).
2. `alembic upgrade head` (recria as tabelas vazias).
3. `sync_pokeapi.py --data-path api-data --max-generation 9` de novo
   (repopula o catálogo — não precisa clonar o dump de novo se
   `backend/api-data/` já existir).
