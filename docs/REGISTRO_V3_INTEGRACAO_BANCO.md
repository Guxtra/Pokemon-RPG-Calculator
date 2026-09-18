# Pokémon RPG Calculator V3 — Registro de Integração Banco/API

## Objetivo deste arquivo

Este documento registra o que foi executado nesta etapa da V3 da **Pokémon RPG Calculator**, para que outro assistente (Claude) consiga entender o estado atual do projeto e continuar sem repetir etapas ou alterar partes que já foram validadas.

---

## 1. Contexto da V3

A V3 tem como objetivo substituir a entrada manual de todos os Pokémon por um catálogo integrado ao banco de dados.

Fluxo esperado:

**Frontend React/Vite → API FastAPI → PostgreSQL → dados de Pokémon/golpes → cálculo de dano**

A ideia é permitir seleção de Pokémon e golpes pelo catálogo, obter os dados automaticamente e manter o modo manual disponível para uso no RPG.

---

## 2. Backend e ambiente virtual

O backend está localizado em:

```text
C:\Users\Gustavo\Desktop\Projeto Pokemon\pokemon-rpg-calculator-v3\backend
```

O ambiente virtual (`.venv`) foi ativado antes da execução do sync. Isso é correto e **não foi um problema**.

Comando usado para ativar:

```powershell
.venv\Scripts\activate
```

Também foi possível executar o Python diretamente com:

```powershell
.venv\Scripts\python.exe
```

---

## 3. Backend FastAPI foi validado

Foi iniciado o Uvicorn com:

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

Resultado:

```text
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

O endpoint de health check também foi testado:

```powershell
curl http://localhost:8000/health
```

Resposta obtida:

```json
{
  "status": "ok",
  "database": "ok",
  "environment": "development"
}
```

Isso confirmou que:

- FastAPI está iniciando.
- PostgreSQL está acessível pelo backend.
- A aplicação consegue estabelecer conexão com o banco.

---

## 4. Problema inicial ao executar o sync

O script de sincronização é:

```text
backend/scripts/sync_pokeapi.py
```

Ao executar inicialmente:

```powershell
.venv\Scripts\python.exe scripts\sync_pokeapi.py
```

foi apresentado:

```text
ModuleNotFoundError: No module named 'app'
```

A causa foi a resolução do pacote Python ao executar o script diretamente.

Foi corrigido temporariamente usando:

```powershell
$env:PYTHONPATH="."
```

Depois disso o script passou a executar corretamente.

---

## 5. Caminho dos dados do PokéAPI

O diretório de dados utilizado pelo sync é:

```text
api-data\data\api\v2
```

A partir do diretório `backend`.

---

## 6. Sincronização do banco concluída com sucesso

Foi executado:

```powershell
$env:PYTHONPATH="."
.venv\Scripts\python.exe scripts\sync_pokeapi.py --data-path api-data\data\api\v2 --max-generation 9
```

O processo terminou sem erro.

### Resultado da sincronização

```text
[generation] 9 sincronizadas
[type] 21 sincronizados
[pokemon_species] 1025 sincronizadas (total)
[pokemon] 1025 sincronizados (total)
[move] 937 sincronizados (total)
```

Portanto, nesta etapa temos confirmado:

- Gerações: 9
- Tipos: 21
- Espécies de Pokémon: 1025
- Pokémon: 1025
- Movimentos: 937

**Não é necessário executar o sync novamente neste momento.**

---

## 7. Frontend está rodando

O frontend foi iniciado com:

```powershell
npm run dev
```

O Vite informou:

```text
Local: http://localhost:5173/
```

Portanto o frontend local está disponível em:

```text
http://localhost:5173/
```

---

## 8. Problema atual encontrado no frontend

Ao abrir o site local, a interface apresenta a mensagem:

> Não consegui carregar o catálogo de Pokémon. O modo Manual continua funcionando normalmente.

A interface mostra o modo **Catálogo** para o Pokémon atacante, porém o catálogo não está sendo carregado.

Isso não significa que o banco esteja vazio.

O banco e a API já foram validados separadamente.

---

## 9. Swagger/FastAPI foi validado

Foi aberta a documentação da API:

```text
http://localhost:8000/docs
```

Os seguintes endpoints estão registrados:

```text
GET  /api/pokemon
GET  /api/pokemon/{pokeapi_id}/stats
GET  /api/moves
POST /api/damage/calculate
GET  /health
```

---

## 10. Teste definitivo do catálogo pela API

Foi executado no Swagger o endpoint:

```text
GET /api/pokemon
```

Resultado:

```text
HTTP 200
```

O corpo da resposta trouxe dados reais do banco.

Exemplo observado para Bulbasaur:

```json
{
  "pokeapi_id": 1,
  "name": "bulbasaur",
  "national_dex_number": 1,
  "type1": "grass",
  "type2": "poison",
  "base_hp": 45,
  "base_atk": 49,
  "base_def": 49,
  "base_sp_atk": 65,
  "base_sp_def": 65,
  "base_speed": 45
}
```

### Conclusão deste teste

Está comprovado que o fluxo abaixo funciona:

```text
PostgreSQL ✅
    ↓
FastAPI ✅
    ↓
GET /api/pokemon ✅
    ↓
Dados reais dos Pokémon ✅
```

Logo, o erro atual não está na importação dos dados nem no endpoint `GET /api/pokemon`.

---

## 11. Onde o problema provavelmente está

O problema restante está no consumo da API pelo frontend.

Fluxo a investigar:

```text
Frontend http://localhost:5173
        ↓
   chamada HTTP
        ↓
Backend http://localhost:8000/api/pokemon
```

Como o endpoint funciona no Swagger com HTTP 200, verificar no frontend principalmente:

1. URL/base da API usada pelo frontend.
2. Variável de ambiente usada para definir a URL da API.
3. CORS/configuração de origem.
4. Função responsável por buscar o catálogo.
5. Tratamento da resposta JSON.
6. Nome/estrutura dos campos esperados pelo frontend versus os campos realmente retornados.
7. Erros visíveis no Console/Network do navegador.

---

## 12. Estado atual dos terminais

### Backend

Deve ficar rodando em:

```text
http://127.0.0.1:8000
```

Comando:

```powershell
cd "C:\Users\Gustavo\Desktop\Projeto Pokemon\pokemon-rpg-calculator-v3\backend"
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

### Frontend

Deve ficar rodando em:

```text
http://localhost:5173
```

Comando:

```powershell
cd "C:\Users\Gustavo\Desktop\Projeto Pokemon\pokemon-rpg-calculator-v3"
npm run dev
```

---

## 13. O que NÃO deve ser repetido agora

Não executar novamente o sync apenas para tentar resolver o erro do frontend:

```powershell
scripts\sync_pokeapi.py
```

A sincronização já foi concluída com sucesso para a geração 9.

Também não é necessário alterar o banco sem antes identificar um erro real.

---

## 14. Próximo objetivo para finalizar esta etapa da V3

O objetivo imediato é fazer o frontend consumir corretamente:

```text
GET /api/pokemon
```

Depois disso, validar no site:

### Teste 1 — Pokémon

Selecionar/pesquisar um Pokémon, por exemplo:

```text
Pikachu
```

O frontend deve conseguir obter os dados do catálogo pela API.

### Teste 2 — Stats por nível

Usar:

```text
GET /api/pokemon/{pokeapi_id}/stats
```

e confirmar que os stats necessários para o nível escolhido são retornados e usados pela interface.

### Teste 3 — Golpes

Validar:

```text
GET /api/moves
```

para preencher o catálogo de golpes.

### Teste 4 — Cálculo

Validar:

```text
POST /api/damage/calculate
```

para confirmar que os dados selecionados pelo frontend chegam corretamente ao motor de cálculo.

### Teste 5 — Troca de atacante/defensor

Usar o botão **Trocar** da interface e verificar se a inversão de atacante/defensor continua funcionando com dados vindos do catálogo.

---

## 15. Critério prático para considerar esta integração concluída

A integração desta parte da V3 pode ser considerada funcional quando:

```text
Frontend
  ↓
seleciona Pokémon do catálogo
  ↓
API busca os dados
  ↓
PostgreSQL fornece os dados
  ↓
frontend exibe os dados/stats
  ↓
usuário seleciona golpe
  ↓
API/motor calcula o dano
  ↓
resultado aparece corretamente
```

O modo **Manual** deve continuar funcionando como antes.

---

## 16. Resumo para continuidade no Claude

Estado atual:

```text
[OK] Ambiente virtual
[OK] PostgreSQL
[OK] FastAPI
[OK] /health
[OK] Sync PokéAPI
[OK] 9 gerações
[OK] 1025 Pokémon
[OK] 937 movimentos
[OK] GET /api/pokemon
[OK] Swagger
[OK] Frontend Vite

[PENDENTE] Frontend consumir corretamente o catálogo da API
[PENDENTE] Validar stats por nível no frontend
[PENDENTE] Validar catálogo de golpes no frontend
[PENDENTE] Validar cálculo ponta a ponta
```

### Mensagem recomendada para passar ao Claude

> A sincronização do PokéAPI já foi concluída com sucesso no PostgreSQL usando `scripts\\sync_pokeapi.py --data-path api-data\\data\\api\\v2 --max-generation 9`.
>
> Resultado: 9 gerações, 21 tipos, 1025 espécies, 1025 Pokémon e 937 movimentos sincronizados.
>
> O backend FastAPI também está funcionando em `http://127.0.0.1:8000` e `/health` retorna `{"status":"ok","database":"ok","environment":"development"}`.
>
> O Swagger em `http://localhost:8000/docs` mostra os endpoints `/api/pokemon`, `/api/pokemon/{pokeapi_id}/stats`, `/api/moves`, `/api/damage/calculate` e `/health`.
>
> O endpoint `GET http://localhost:8000/api/pokemon` foi testado diretamente no Swagger e retorna HTTP 200 com dados reais do banco, incluindo Bulbasaur e seus stats base.
>
> Porém o frontend em `http://localhost:5173` exibe: “Não consegui carregar o catálogo de Pokémon. O modo Manual continua funcionando normalmente.”
>
> Portanto, não rode o sync novamente e não altere o banco sem necessidade. O próximo foco é corrigir a integração frontend → API, verificando URL/base da API, variáveis de ambiente, CORS, chamada HTTP e mapeamento da resposta JSON. Depois valide Pokémon → stats por nível → golpe → cálculo de dano → troca atacante/defensor.

---

## 17. Observação importante sobre o `.venv`

O fato de o `.venv` ter sido ativado **antes** do sync está correto.

Sequência usada:

```powershell
.venv\Scripts\activate
```

seguida da execução do Python/script.

Isso não causou o erro do frontend e não precisa ser alterado.

---

## Data do registro

15/09/2026

## Projeto

**Pokémon RPG Calculator V3**
