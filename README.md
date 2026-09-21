# Pokémon RPG Calculator

Calculadora de dano para um RPG inspirado em Pokémon full-stack: frontend React/TypeScript consumindo uma API própria em Python, com um motor de cálculo testado e um catálogo de Pokémon/golpes sincronizado a partir da PokéAPI.

> **A fórmula de dano usada aqui é uma regra própria deste projeto.** Ela **não** reproduz a fórmula interna dos jogos oficiais de Pokémon.

**Status:** V3.0.0 publicada em produção e validada. Frontend em Cloudflare Workers, backend + PostgreSQL em Railway, com integração completa entre catálogo, stats e cálculo de dano.

---

## Objetivo

Transformar a calculadora manual original numa aplicação onde o catálogo de Pokémon e golpes vem de um banco de dados real, e o cálculo de dano é feito por um motor em Python que é a **fonte da verdade** — o frontend só monta a jogada e mostra o resultado, nunca calcula por conta própria.

```text
Frontend (React + TypeScript)
        ↓ HTTP / JSON
FastAPI
        ↓
PostgreSQL + Motor de cálculo (Python)
```

## Principais funcionalidades da V3

- Dois painéis fixos, **Seu Pokémon** e **Pokémon Adversário**. A posição deles nunca muda; o botão **Trocar** só inverte quem ataca e quem defende na jogada atual.
- Cada painel de Pokémon e Golpe possui a busca do **Catálogo** sempre disponível. A seleção preenche os dados automaticamente, mas os campos continuam totalmente editáveis, permitindo ajustes manuais sem alterar o catálogo oficial.
- Catálogo com **1025 Pokémon** e **937 golpes**, cobrindo as Gerações I a IX, sincronizado localmente a partir do dump estático da PokéAPI (nunca em tempo real durante o uso normal).
- Cálculo de dano feito **exclusivamente pelo backend**. O frontend não tem mais nenhuma implementação própria da fórmula ativa no fluxo principal.

## Arquitetura

```text
src/                          # Frontend — React + TypeScript + Vite
├── core/                     # Motor de cálculo em TS (histórico da V2)
├── frontend/
│   ├── components/           # Painéis, campos, busca de catálogo
│   └── lib/                  # Cliente de API, parsing de formulário
└── tests/                    # Testes Vitest

backend/                      # Backend — FastAPI + SQLAlchemy + PostgreSQL
├── app/
│   ├── core/                 # Motor de cálculo em Python — fonte da verdade
│   ├── models/               # 5 tabelas de domínio
│   ├── schemas/              # Contratos Pydantic
│   ├── services/             # Orquestração banco + core
│   └── api/                  # Routers HTTP
├── scripts/
│   └── sync_pokeapi.py       # Sincronização do catálogo (CLI, offline)
├── migrations/               # Alembic
└── tests/                    # Testes pytest
```

> **Nota sobre `src/core/`:** esse motor em TypeScript é o herdado da V2. Ele continua no repositório e com seus testes passando, mas **não é mais usado no fluxo principal**. O cálculo de dano do app vai sempre pelo `POST /api/damage/calculate` (motor em Python). Ele fica como referência histórica e não deve virar uma segunda implementação da fórmula ativa.

## Tecnologias

**Frontend:** React 19, TypeScript, Vite, Vitest.  
**Backend:** Python 3.14, FastAPI, SQLAlchemy (síncrono), Alembic, Pydantic.  
**Banco:** PostgreSQL (Docker em desenvolvimento).  
**Dados:** dump estático [`PokeAPI/api-data`](https://github.com/PokeAPI/api-data), sincronizado offline.

## Execução local

Pré-requisitos: Node.js, Python 3.14, Docker Desktop. Passo a passo completo em [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

```text
# Backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend (em outro terminal, na raiz)
npm install
npm run dev
```

Abre `http://localhost:5173` com o backend em `http://localhost:8000`.

## Variáveis de ambiente

**Frontend** (`.env`, a partir de `.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`, a partir de `backend/.env.example`):

```env
DATABASE_URL=postgresql://pokemon:pokemon@localhost:5432/pokemon_rpg
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=development
```

`.env` nunca é commitado — só os `.env.example` correspondentes.

## Banco de dados

PostgreSQL com 5 tabelas: `generation`, `type`, `pokemon_species`, `pokemon`, `move`. Migrations gerenciadas via Alembic (`alembic upgrade head`).

## Sincronização do catálogo

O catálogo **não** é consultado da PokéAPI ao vivo durante o uso. Ele é populado via script CLI a partir de um clone local do dump estático:

```text
cd backend
.venv\Scripts\python.exe -m scripts.sync_pokeapi --data-path api-data --max-generation 9
```

Idempotente — pode rodar de novo sem duplicar dados.

## Testes

```text
# Frontend
npm test
npm run typecheck
npm run lint
npm run build

# Backend
.venv\Scripts\python.exe -m pytest
```

**Estado atual:** 49 testes no frontend e 63 no backend, todos passando.

Além dos testes automatizados, a aplicação publicada foi validada em produção com fluxo completo de catálogo, carregamento de stats, seleção de golpes, cálculo de dano, edição manual e uso do botão **Trocar**. O funcionamento também foi verificado por outros usuários.

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Confirma que a API e o banco estão de pé |
| GET | `/api/pokemon` | Lista o catálogo de Pokémon |
| GET | `/api/pokemon/{pokeapiId}/stats?level=N` | Stats calculados para o nível pedido |
| GET | `/api/moves` | Lista o catálogo de golpes |
| POST | `/api/damage/calculate` | Calcula o dano de uma jogada (fonte da verdade) |

Erros seguem o formato:

```json
{
  "errors": [
    {
      "field": "...",
      "message": "..."
    }
  ]
}
```

## Deploy

**Concluído.**

- **Frontend:** Cloudflare Workers
- **Backend + PostgreSQL:** Railway
- **API:** `https://pokemon-rpg-calculator-production-4ef3.up.railway.app`
- **Frontend:** `https://pokemon-rpg-calculator.vyperd2.workers.dev`

O deploy da V3 foi concluído e o fluxo completo foi validado em produção. O guia de infraestrutura está em [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Evolução do projeto

- **V1** — calculadora inicial, MVP simples.
- **V2.0.0** — redesign completo: React + TypeScript + Vite, motor de cálculo testado (32 testes), UI dedicada, sem persistência nem catálogo. Publicada no Cloudflare Workers.
- **V3.0.0** — arquitetura full-stack: backend FastAPI, PostgreSQL, motor de cálculo portado 1:1 para Python (fonte da verdade), catálogo real sincronizado da PokéAPI (Gerações I-IX), frontend integrado consumindo a API e deploy em produção com Railway + Cloudflare Workers.

## Próximos passos

A V3.0.0 está fechada. Novas funcionalidades maiores ficam para versões futuras, incluindo a evolução planejada para a V4, com recursos como usuários, campanhas, fichas e histórico.
