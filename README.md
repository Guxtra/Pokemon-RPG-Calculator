# Pokémon RPG Calculator

Calculadora de dano para um RPG inspirado em Pokémon full-stack:
frontend React/TypeScript consumindo uma API própria em Python, com um
motor de cálculo testado e um catálogo de Pokémon/golpes sincronizado
a partir da PokéAPI.

> **A fórmula de dano usada aqui é uma regra própria deste projeto.**
> Ela **não** reproduz a fórmula interna dos jogos oficiais de Pokémon.

**Status:** V3 em desenvolvimento / pré-deploy — funcional e testada
localmente (frontend + backend + banco), deploy em produção ainda
pendente. Ver [Evolução do projeto](#evolução-do-projeto).

---

## Objetivo

Transformar a calculadora manual original numa aplicação onde o
catálogo de Pokémon e golpes vem de um banco de dados real, e o
cálculo de dano é feito por um motor em Python que é a **fonte da
verdade** — o frontend só monta a jogada e mostra o resultado, nunca
calcula por conta própria.

```
Frontend (React + TypeScript)
        ↓  HTTP / JSON
FastAPI
        ↓
PostgreSQL  +  Motor de cálculo (Python)
```

## Principais funcionalidades da V3

- Dois painéis fixos, **Seu Pokémon** e **Pokémon Adversário** a
  posição deles nunca muda; o botão **Trocar** só inverte quem ataca
  e quem defende na jogada atual.
- Cada painel (Pokémon e Golpe) tem modo **Catálogo** (busca por nome
  ou nº da Pokédex, stats calculados automaticamente pro nível
  escolhido) e modo **Manual** (digitar os valores na mão) os dois
  continuam totalmente editáveis depois de carregados, sem alterar o
  catálogo oficial.
- Catálogo com **1025 Pokémon** e **937 golpes**, cobrindo as
  Gerações I a IX, sincronizado localmente a partir do dump estático
  da PokéAPI (nunca em tempo real durante o uso normal).
- Cálculo de dano feito **exclusivamente pelo backend** o frontend
  não tem mais nenhuma implementação própria da fórmula ativa no
  fluxo principal.

## Arquitetura

```
src/                          # Frontend — React + TypeScript + Vite
├── core/                     # Motor de cálculo em TS (histórico da V2 —
│                              # não é mais a fonte de verdade, ver nota abaixo)
├── frontend/
│   ├── components/           # Painéis, campos, busca de catálogo
│   └── lib/                  # Cliente de API, parsing de formulário
└── tests/                    # Testes Vitest

backend/                      # Backend — FastAPI + SQLAlchemy + PostgreSQL
├── app/
│   ├── core/                 # Motor de cálculo em Python — fonte da verdade
│   ├── models/                # 5 tabelas: generation, type, pokemon_species, pokemon, move
│   ├── schemas/                # Contratos Pydantic (formato, não regra de negócio)
│   ├── services/               # Orquestração banco + core
│   └── api/                    # Routers HTTP
├── scripts/
│   └── sync_pokeapi.py       # Sincronização do catálogo (CLI, offline)
├── migrations/                # Alembic
└── tests/                     # Testes pytest
```

> **Nota sobre `src/core/`:** esse motor em TypeScript é o herdado da
> V2. Ele continua no repositório e com seus testes passando, mas
> **não é mais usado no fluxo principal** o cálculo de dano do app
> vai sempre pelo `POST /api/damage/calculate` (motor em Python). Ele
> fica como referência histórica e não deve virar uma segunda
> implementação da fórmula ativa.

## Tecnologias

**Frontend:** React 19, TypeScript, Vite, Vitest.
**Backend:** Python 3.14, FastAPI, SQLAlchemy (síncrono), Alembic, Pydantic.
**Banco:** PostgreSQL (Docker em desenvolvimento).
**Dados:** dump estático [`PokeAPI/api-data`](https://github.com/PokeAPI/api-data), sincronizado offline.

## Execução local

Pré-requisitos: Node.js, Python 3.14, Docker Desktop. Passo a passo
completo (venv, banco, migrations, sync do catálogo, servidor) em
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

Resumo:

```bash
# Backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend (em outro terminal, na raiz do projeto)
npm install
npm run dev
```

Abre `http://localhost:5173` com o backend em `http://localhost:8000`.

## Variáveis de ambiente

**Frontend** (raiz do projeto, `.env`, copiado de `.env.example`):

```
VITE_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`, copiado de `backend/.env.example`):

```
DATABASE_URL=postgresql://pokemon:pokemon@localhost:5432/pokemon_rpg
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=development
```

`.env` nunca é commitado — só os `.env.example` correspondentes.

## Banco de dados

PostgreSQL, com 5 tabelas: `generation`, `type`, `pokemon_species`,
`pokemon`, `move`. Migrations gerenciadas via Alembic
(`alembic upgrade head`).

## Sincronização do catálogo

O catálogo **não** é consultado da PokéAPI ao vivo durante o uso da
aplicação. Ele é populado uma vez (ou quando quiser atualizar) via
script CLI, a partir de um clone local do dump estático:

```bash
cd backend
.venv\Scripts\python.exe -m scripts.sync_pokeapi --data-path api-data --max-generation 9
```

Idempotente — pode rodar de novo sem duplicar dados.

## Testes

```bash
# Frontend (raiz do projeto)
npm test           # Vitest
npm run typecheck  # tsc
npm run lint        # oxlint
npm run build        # build de produção

# Backend (dentro de backend/, com o venv ativado)
.venv\Scripts\python.exe -m pytest
```

Estado atual: 49 testes no frontend e 63 no backend, todos passando.

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Confirma que a API e o banco estão de pé |
| GET | `/api/pokemon` | Lista o catálogo de Pokémon |
| GET | `/api/pokemon/{pokeapiId}/stats?level=N` | Stats calculados pro nível pedido |
| GET | `/api/moves` | Lista o catálogo de golpes |
| POST | `/api/damage/calculate` | Calcula o dano de uma jogada (fonte da verdade) |

Erros seguem sempre o formato `{"errors": [{"field": "...", "message": "..."}]}`.

## Evolução do projeto

- **V1** calculadora inicial, MVP simples.
- **V2.0.0** redesign completo: React + TypeScript + Vite, motor de
  cálculo testado (32 testes), UI dedicada, sem persistência nem
  catálogo (dados digitados na mão). Publicada no Cloudflare Workers.
- **V3** *(este README)* arquitetura full-stack: backend FastAPI,
  PostgreSQL, motor de cálculo portado 1:1 para Python (fonte da
  verdade), catálogo real sincronizado da PokéAPI (Gerações I-IX), e
  frontend integrado consumindo a API em vez de calcular localmente.

### Deploy

**Pendente.** A arquitetura planejada é backend + PostgreSQL no
Railway e frontend no Cloudflare Workers — ver
[`docs/DEPLOY.md`](docs/DEPLOY.md) para o guia (ainda não executado).
Enquanto isso, o projeto roda inteiramente local.
