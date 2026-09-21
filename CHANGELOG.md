# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

Mudanças futuras após a V3.0.0.

---

## [3.0.0] — 2026-09-21

### Adicionado

- Backend FastAPI + SQLAlchemy (síncrono) + Alembic + PostgreSQL.
- Motor de cálculo portado 1:1 de TypeScript para Python (`backend/app/core/`), agora a fonte da verdade do cálculo.
- 5 tabelas de domínio: `generation`, `type`, `pokemon_species`, `pokemon`, `move`.
- Script de sincronização do catálogo a partir do dump estático `PokeAPI/api-data` (`backend/scripts/sync_pokeapi.py`), idempotente e offline. Catálogo sincronizado: Gerações I-IX, 1025 Pokémon, 937 golpes e 21 tipos.
- Endpoints HTTP: `GET /health`, `GET /api/pokemon`, `GET /api/pokemon/{pokeapiId}/stats`, `GET /api/moves`, `POST /api/damage/calculate`.
- Formato de erro padronizado para erros de formato (Pydantic) e de regra de negócio (core).
- Cliente de API no frontend (`src/frontend/lib/api.ts`).
- Painéis fixos "Seu Pokémon" / "Pokémon Adversário", com indicador de direção e botão "Trocar".
- Busca e seleção de Pokémon e golpes pelo catálogo, com preenchimento automático e campos editáveis.
- Cálculo de dano do frontend trocado de local (TypeScript) para exclusivamente via `POST /api/damage/calculate`.
- Deploy do backend + PostgreSQL no Railway.
- Deploy do frontend no Cloudflare Workers.
- Validação do fluxo completo em produção, incluindo testes realizados por múltiplos usuários.

### Alterado

- O motor de cálculo em TypeScript (`src/core/`) deixou de ser usado no fluxo principal do app — permanece no repositório como histórico da V2, com seus testes originais preservados.
- A busca do catálogo permanece disponível diretamente na interface, sem alternância entre modos Manual e Catálogo.

---

## [2.0.0] — V2

- Redesign completo do frontend: React 19 + TypeScript + Vite.
- Motor de cálculo em TypeScript, validando a própria entrada (`calculateDamage` chama `validateBattleInput`), com 32 testes automatizados (Vitest).
- Tabela de efetividade de tipo explícita (matriz 18×18).
- UI "ticket-style": painéis de Atacante/Defensor/Golpe/Modificadores, resultado detalhado e botão "Copiar resultado".
- Sem persistência, sem catálogo — todos os dados digitados manualmente.
- Publicada no Cloudflare Workers.
- Nasceu da fusão de duas implementações independentes ("V-A" e "V-B") feitas a partir do mesmo documento de regras.

---

## [1.0.0] — V1

- Calculadora inicial (MVP).
