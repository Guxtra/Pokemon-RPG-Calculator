# Deploy — Pokémon RPG Calculator V3

**Este guia ainda não foi executado.** Documenta o processo planejado
para quando o deploy for autorizado. Nenhum recurso remoto (Railway)
foi criado ainda — o projeto Cloudflare Workers do frontend já existe
(é onde a V2 está publicada hoje, com Workers Builds conectado ao
GitHub) e será reaproveitado, não recriado.

Arquitetura planejada:

```
Cloudflare Workers (frontend, já existe — Workers Builds conectado ao GitHub)
        ↓ HTTPS
FastAPI (Railway — a criar)
        ↓
PostgreSQL (Railway — a criar)
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
| `CORS_ORIGINS` | `http://localhost:5173` inicialmente; depois de confirmar a URL de produção do Cloudflare Pages (passo 8 abaixo), adicionar aqui também, separada por vírgula |
| `ENVIRONMENT` | `production` |

`app/config.py` já lê essas variáveis do ambiente — em produção o
Railway as injeta diretamente, sem precisar de arquivo `.env` no
servidor.

### 4. Arquivos de infraestrutura já preparados

- `backend/Procfile`: `web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` — roda as migrations a cada deploy (seguro, idempotente) e sobe o servidor.
- `backend/.python-version`: fixa Python 3.14, igual ao ambiente local. **Atenção:** conferir se esse arquivo está com o nome certo no repositório (com o ponto no início) — já apareceu sem o ponto em outra etapa.

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

## Frontend (Cloudflare Workers — Workers Builds)

O projeto já existe no Cloudflare Workers (`pokemon-rpg-calculator`,
domínio `pokemon-rpg-calculator.vyperd2.workers.dev`), com **Workers
Builds** conectado ao repositório do GitHub — é onde a V2 está
publicada. Não é preciso criar nada novo, só reconfigurar pra apontar
pra API de produção.

### 8. Verificar o arquivo de configuração do Worker

Workers com build via Git normalmente precisam de um `wrangler.jsonc`
ou `wrangler.toml` no repositório, descrevendo como servir os arquivos
estáticos gerados pelo `vite build` (`assets` apontando pra `dist/`).
**Esse arquivo não apareceu na inspeção do repositório até agora** —
antes de mexer em qualquer configuração, confirma no dashboard
(`Workers` → `pokemon-rpg-calculator` → **Settings** → **Build**) qual
é o **build command** e o **deploy command** configurados ali. Se
existir um `wrangler.jsonc`/`wrangler.toml` no repo que eu não vi
(talvez fora do que foi zipado/enviado até agora), me manda o conteúdo
antes do deploy — pra eu confirmar que ele não hardcoda nenhuma URL de
API antiga.

### 9. Configurar a variável de ambiente de build

No dashboard: `Workers` → `pokemon-rpg-calculator` → **Settings** →
**Variables and Secrets** (ou **Build variables**, dependendo de como
o Workers Builds expõe isso na sua conta) → adicionar:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL pública do backend no Railway (passo 7) |

**Importante:** o Vite embute variáveis `VITE_*` no JavaScript **na
hora do build**, não em tempo de execução. Ela precisa estar
disponível durante o `npm run build` que o Workers Builds roda — se o
painel separar "variáveis de build" de "variáveis de runtime", use a
de build. Qualquer mudança nela exige um novo build/deploy, não só
"reiniciar" o Worker.

### 10. Atualizar o CORS do backend

O domínio de produção do frontend já é conhecido:
`https://pokemon-rpg-calculator.vyperd2.workers.dev` (confirmado, não
customizado). Depois do passo 9, volta no Railway e atualiza
`CORS_ORIGINS` (passo 3) incluindo essa URL, separada por vírgula da
de localhost.

### 11. Novo deploy do frontend

Um push no GitHub dispara o Workers Build automaticamente com a nova
`VITE_API_URL` já embutida (já que é Git-integrado). Se preferir
forçar sem push, o dashboard deve ter um botão de **redeploy** manual.

---

## Depois do deploy — validação E2E em produção

Só depois que backend e frontend estiverem publicados e apontando um
pro outro:

1. Abrir a URL pública do frontend (Cloudflare Pages).
2. Confirmar que o catálogo de Pokémon e de golpes carrega (sem erro
   de CORS no console do navegador).
3. Fazer um cálculo completo (Catálogo → Catálogo → Calcular) e
   confirmar que o resultado vem da API de produção (não de nenhum
   cálculo local).
4. Testar o botão Trocar em produção.
5. Confirmar HTTPS em ambas as pontas (deveria vir de graça, tanto
   Railway quanto Cloudflare Pages servem HTTPS por padrão).

Só ao final dessa validação a V3 deve ser considerada pronta para a
tag de release `3.0.0` (ver `CHANGELOG.md`).
