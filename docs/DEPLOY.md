# Deploy — Pokémon RPG Calculator V3

**Este guia ainda não foi executado.** Documenta o processo planejado
para quando o deploy for autorizado. Nenhum recurso remoto (Railway,
Cloudflare) foi criado ainda.

Arquitetura planejada:

```
Cloudflare Workers (frontend)
        ↓ HTTPS
FastAPI (Railway)
        ↓
PostgreSQL (Railway)
```

---

## Backend + banco (Railway)

### 1. Criar o projeto

Em [railway.app](https://railway.app): **New Project** → **Deploy from
GitHub repo** → `Guxtra/Pokemon-RPG-Calculator`. Como o repositório tem
frontend e backend juntos, defina o **Root Directory** do serviço como
`backend` (Settings do serviço → Root Directory).

### 2. PostgreSQL

No mesmo projeto: **New** → **Database** → **PostgreSQL**. O Railway
cria uma variável `DATABASE_URL` nesse plugin automaticamente.

No serviço do backend, em **Variables**, referencie essa URL —
`DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (o Railway tem um
seletor pra isso).

### 3. Variáveis de ambiente do backend

| Variável | Valor |
|---|---|
| `DATABASE_URL` | referência ao plugin Postgres (passo 2) |
| `CORS_ORIGINS` | `http://localhost:5173` inicialmente; depois de publicar o frontend, adicionar a URL de produção, separada por vírgula |
| `ENVIRONMENT` | `production` |

`app/config.py` já lê essas variáveis do ambiente — em produção o
Railway as injeta diretamente, sem precisar de arquivo `.env` no
servidor.

### 4. Arquivos de infraestrutura já preparados

- `backend/Procfile`: `web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` — roda as migrations a cada deploy (seguro, idempotente) e sobe o servidor.
- `backend/.python-version`: fixa Python 3.14, igual ao ambiente local.

Não alterar esses arquivos sem necessidade (conforme AGENTS.md).

### 5. Deploy

Com Root Directory, Postgres e variáveis configurados, o Railway builda
e sobe automaticamente a cada push (ou manualmente pelo dashboard,
botão **Deploy**).

### 6. Sincronizar o catálogo em produção

As migrations criam as tabelas, mas não populam dados — isso é o
`sync_pokeapi.py`, que só roda localmente/offline (decisão do
projeto: sem endpoint público de sync). Via **Railway CLI**:

```bash
railway link   # conecta a CLI ao projeto criado
cd backend
railway run python -m scripts.sync_pokeapi --data-path api-data --max-generation 9
```

Isso roda o script na sua máquina, mas usando as variáveis de ambiente
de produção (incluindo o `DATABASE_URL` real) — o Postgres do Railway
recebe os dados sem expor a URL pública do banco.

### 7. Validar a API pública

```bash
curl https://<sua-url-do-railway>/health
curl https://<sua-url-do-railway>/api/pokemon
```

O primeiro confirma que o processo subiu e o banco está acessível; o
segundo só devolve dados depois do passo 6.

---

## Frontend (Cloudflare Workers) — processo a confirmar

**Pendente de definição.** O repositório não tem `wrangler.toml`, nem
`wrangler` como dependência, nem script de deploy — então a publicação
atual da V2 nesse Workers provavelmente foi feita por fora do
repositório (upload manual, ou um processo em outro lugar). Não vou
assumir que a V3 vai usar o mesmo processo.

O que já sabemos que a V3 precisa, independente do método escolhido:

- `VITE_API_URL` configurada para a URL pública do backend no Railway
  (nunca hardcoded em componente nenhum — já é assim no código).
- `npm run build` gera `dist/` com os arquivos estáticos prontos.
- CORS do backend precisa incluir a origem de produção do frontend
  (passo 3 da seção do backend, acima).

Antes de detalhar os passos exatos de publicação (wrangler CLI direto,
Cloudflare Pages conectado ao GitHub, upload manual do `dist/`, etc.),
preciso que você confirme qual método a V2 usa hoje — daí completo
esta seção com o processo real, sem inventar.

---

## Depois do deploy — validação E2E em produção

Só depois que backend e frontend estiverem publicados:

1. Abrir a URL pública do frontend.
2. Confirmar que o catálogo de Pokémon e de golpes carrega (sem erro
   de CORS no console).
3. Fazer um cálculo completo (Catálogo → Catálogo → Calcular) e
   confirmar que o resultado vem da API de produção (não de nenhum
   cálculo local).
4. Testar o botão Trocar em produção.
5. Confirmar HTTPS em ambas as pontas.

Só ao final dessa validação a V3 deve ser considerada pronta para a
tag de release `3.0.0` (ver `CHANGELOG.md`).
