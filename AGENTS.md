# AGENTS.md — Pokémon RPG Calculator V3

## 1. Finalidade

Este arquivo define as regras operacionais do Hermes Agent dentro do projeto **Pokémon RPG Calculator V3**.

O Hermes atua como **agente de implementação e automação**. O usuário continua sendo responsável pelas decisões de produto, arquitetura, regras de negócio, infraestrutura e mudanças irreversíveis.

### Princípio central

> O Hermes pode implementar mudanças autorizadas, mas não pode tomar decisões importantes de arquitetura, regra de negócio, banco de dados, API, infraestrutura ou comportamento do produto por conta própria.

Quando uma melhoria extrapolar a tarefa atual:

```text
NÃO IMPLEMENTAR AUTOMATICAMENTE.
```

Em vez disso:

1. explicar a melhoria;
2. justificar;
3. informar o impacto;
4. aguardar autorização explícita.

---

# 2. Projeto

**Nome:** Pokémon RPG Calculator

**Repositório:**
https://github.com/Guxtra/Pokemon-RPG-Calculator

A V2 é a versão publicada anteriormente. A V3 é a expansão para uma arquitetura com backend, API, banco de dados e motor de cálculo em Python.

Objetivo da V3:

```text
Frontend
   ↓
API
   ↓
Banco de dados
   ↓
Motor de cálculo em Python
```

Docker faz parte da infraestrutura do backend.

---

# 3. Stack atual

## Frontend

- React
- TypeScript
- Vite

## Backend

- Python 3.14
- FastAPI
- SQLAlchemy síncrono
- Alembic

## Banco

- PostgreSQL

## Infraestrutura

- Docker
- Cloudflare Workers para frontend
- Railway planejado para backend + PostgreSQL

---

# 4. Regras de trabalho

Sempre trabalhar em pequenas etapas.

Para cada tarefa:

### Etapa 1 — Entender

Antes de alterar qualquer coisa, ler:

- estrutura do projeto;
- arquivos relevantes;
- código relacionado;
- testes;
- documentação existente.

### Etapa 2 — Planejar

Informar:

- o que será alterado;
- quais arquivos serão afetados;
- impactos;
- riscos;
- dependências.

### Etapa 3 — Executar

Fazer a menor alteração necessária para concluir a tarefa autorizada.

### Etapa 4 — Validar

Executar os testes e verificações pertinentes.

### Etapa 5 — Relatar

Informar:

```text
Arquivos alterados:
...

Testes:
...

Resultado:
...

Problemas:
...

Próximo passo sugerido:
...
```

Quando uma etapa puder ser dividida em passos menores, apresentar a divisão e deixar o usuário escolher.

Não implementar múltiplas etapas de uma vez sem autorização.

---

# 5. Regras de autorização

O usuário deve autorizar explicitamente mudanças importantes.

## 5.1 Arquitetura

Não alterar sem autorização:

- estrutura geral frontend/backend;
- divisão de responsabilidades;
- API;
- banco;
- motor de cálculo;
- Docker;
- estratégia de sincronização;
- integração frontend/API/banco;
- infraestrutura de produção.

## 5.2 Regras de negócio

Não alterar sem autorização:

- fórmula de dano;
- STAB;
- multiplicadores;
- crítico;
- modificadores de atributos;
- tratamento de DEF = 0;
- tratamento de ATK = 0;
- arredondamento;
- regras de tipos;
- imunidade;
- escopo de gerações.

## 5.3 Banco de dados

Não alterar sem autorização:

- tabelas;
- colunas;
- relacionamentos;
- migrations;
- constraints;
- dados oficiais sincronizados;
- origem dos dados;
- processo de sincronização.

## 5.4 API

Não alterar sem autorização:

- endpoints;
- contratos;
- formatos de resposta;
- nomes de campos;
- validações públicas;
- mecanismos de autenticação, caso existam futuramente.

## 5.5 Frontend

Não alterar sem autorização:

- fluxo principal da calculadora;
- comportamento dos campos;
- seleção de Pokémon;
- regras de troca atacante/defensor;
- apresentação dos atributos essenciais;
- comportamentos definidos para o RPG.

## 5.6 Dependências

Não instalar, remover ou trocar bibliotecas importantes sem justificar:

- por que a dependência é necessária;
- qual problema resolve;
- impacto;
- alternativa considerada.

---

# 6. Operações destrutivas

Nunca executar automaticamente:

```text
git reset --hard
```

ou qualquer operação equivalente de perda de trabalho.

Também não executar automaticamente:

- remoção em massa de arquivos;
- exclusão do banco;
- remoção de tabelas;
- limpeza destrutiva de dados;
- recriação destrutiva do banco;
- sobrescrita indiscriminada de configurações;
- alterações irreversíveis.

Antes de qualquer ação destrutiva, solicitar autorização explícita.

---

# 7. Git

O Hermes pode:

- executar `git status`;
- analisar `git diff`;
- criar alterações locais;
- executar testes;
- verificar histórico quando necessário.

Por padrão:

```text
NÃO FAZER COMMIT AUTOMÁTICO.
NÃO FAZER PUSH AUTOMÁTICO.
```

Antes de qualquer commit ou push:

1. apresentar resumo do que mudou;
2. informar testes executados;
3. aguardar autorização explícita.

---

# 8. Segredos e configurações

Nunca registrar ou expor:

- API keys;
- tokens;
- senhas;
- credenciais;
- cookies;
- secrets de provedores;
- valores sensíveis de variáveis de ambiente.

Nunca colocar segredos em:

- código-fonte;
- `AGENTS.md`;
- README;
- issues;
- commits;
- mensagens de commit;
- documentação pública.

Arquivos `.env` devem permanecer fora do Git conforme o `.gitignore`.

---

# 9. Estado e decisões da V3

## 9.1 Painéis

Os painéis são:

```text
Seu Pokémon
Pokémon Adversário
```

O botão **Trocar** apenas altera quem ataca e quem defende.

Os painéis permanecem visualmente no mesmo lugar.

O indicador visual de direção deve mostrar quem ataca.

Exemplo:

```text
[ Seu Pokémon ] ── ATACA ──▶ [ Pokémon Adversário ]
```

e, após trocar:

```text
[ Seu Pokémon ] ◀── ATACA ── [ Pokémon Adversário ]
```

## 9.2 Core de cálculo

O core de cálculo foi portado de TypeScript para Python.

O Python é a fonte da verdade do cálculo.

As regras devem permanecer 1:1.

Não alterar regras para "corrigir" ou "melhorar" o sistema sem autorização.

## 9.3 Fórmula de stats por nível

Usar:

```text
Stat = floor(((2 × Base + 31) × Nível / 100) + 5)
```

Configuração interna:

```text
IV = 31
EV = 0
Natureza = neutra
```

Esses detalhes não são exibidos na UI.

HP e Speed não usam essa fórmula nesta versão; quando necessários conforme o escopo atual, retornam como base stat puro.

## 9.4 Natureza

Não sincronizar Naturezas nesta versão.

## 9.5 Sincronização

A sincronização da PokéAPI é feita por script CLI interno.

Não criar endpoint HTTP público de sincronização sem autorização.

Fonte:

```text
PokeAPI/api-data
```

Utilizar o dump estático, não chamadas à API ao vivo para o processo normal de sincronização.

O processo deve ser:

- idempotente;
- seguro para execução repetida;
- baseado em `UNIQUE(pokeapi_id)`;
- feito em lotes;
- capaz de continuar após uma falha.

## 9.6 Banco atual

O modelo inicial possui cinco tabelas:

```text
generation
type
pokemon_species
pokemon
move
```

Por enquanto, importar somente:

```text
is_default = true
```

Formas alternativas ficam para versões futuras.

## 9.7 Golpes de status

Quando o `damage_class` original da PokéAPI for `status`:

```text
power = 0
category = PHYSICAL
```

Guardar o `damage_class` original separadamente em:

```text
pokeapi_damage_class
```

A categoria artificial não deve produzir efeito quando `power = 0`.

## 9.8 Validação

Pydantic é responsável pela validação de formato/estrutura.

As regras de negócio ficam no core:

- valores >= 0;
- tipos válidos;
- Tipo 2 diferente de Tipo 1;
- categoria válida;
- demais regras de domínio.

Não duplicar essas regras sem necessidade entre schemas, routers e core.

## 9.9 SQLAlchemy

Usar SQLAlchemy síncrono.

Não migrar para async/`asyncpg` sem autorização.

## 9.10 Contrato JSON

A API utiliza `camelCase` na comunicação com o frontend:

```text
finalDamage
stabMultiplier
spAtk
def
```

O core Python pode continuar utilizando `snake_case` internamente.

A conversão acontece na camada de schemas da API.

## 9.11 Erros

O frontend deve receber formato padronizado:

```json
{
  "errors": [
    {
      "field": "attacker.atk",
      "message": "..."
    }
  ]
}
```

Não criar formatos diferentes para erros de origem diferente sem autorização.

---

# 10. Motor de dano — regras imutáveis da V3

A V2 estabeleceu as regras que a V3 deve preservar.

## Fórmula

```text
Dano Base =
(Poder do golpe ÷ 10)
×
(Ataque relevante ÷ Defesa relevante)
```

Físico:

```text
ATK / DEF
```

Especial:

```text
Sp. ATK / Sp. DEF
```

Dano final:

```text
Dano Base
× STAB
× Efetividade
× Crítico
× Modificador
```

Ordem:

```text
modificação de atributos
→ dano base
→ STAB
→ efetividade
→ crítico
→ modificador
→ resultado final
```

## STAB

Quando o tipo do golpe corresponde a um dos tipos do atacante:

```text
×1.5
```

Caso contrário:

```text
×1
```

Não acumular STAB.

## Crítico

Desativado:

```text
×1
```

Ativado:

```text
×1.5
```

## Modificador

Campo manual.

Exemplos:

```text
1   = sem alteração
1.5 = +50%
2   = dobro
0.5 = metade
0   = zero dano
```

Aplicado por último.

## Tipos

Utilizar os 18 tipos modernos definidos pelo projeto.

Tipo 1 é obrigatório.

Tipo 2 é opcional.

Tipo 2 não pode repetir Tipo 1.

Defensor com dois tipos:

```text
multiplicador do Tipo 1
×
multiplicador do Tipo 2
```

## Defesa

Entrada:

```text
DEF >= 0
```

Na divisão, a defesa efetiva nunca pode ser menor que:

```text
1
```

Assim:

```text
DEF = 0
```

usa:

```text
DEF efetiva = 1
```

## ATK e Sp. ATK

Podem ser 0.

## Poder

```text
Poder >= 0
```

Quando:

```text
Poder = 0
```

o movimento não causa dano direto.

Pode existir alteração de atributos.

## Arredondamento

Não arredondar etapas intermediárias.

Arredondar somente o dano final.

O resultado final nunca deve ser negativo.

---

# 11. Testes

Nunca remover ou alterar testes somente para fazer o código passar.

Se uma alteração necessária entrar em conflito com um teste:

1. explicar o conflito;
2. explicar a causa;
3. aguardar autorização caso afete uma regra de negócio;
4. somente então alterar o teste/regra.

A suíte do backend deve preservar os testes existentes e adicionar cobertura para novas funcionalidades.

---

# 12. Frontend V3

O frontend continua:

```text
React + TypeScript + Vite
```

A V3 deve manter o modo manual.

Também deve adicionar o modo Catálogo.

## Seu Pokémon / Pokémon Adversário

Cada painel deve permitir:

- modo Catálogo;
- modo Manual;
- seleção de Pokémon;
- nível;
- exibição dos tipos;
- ATK;
- DEF;
- Sp. ATK;
- Sp. DEF;
- edição temporária dos valores carregados.

Editar os valores para um cálculo não pode alterar o catálogo oficial.

## Golpes

A interface deve permitir:

- buscar golpe;
- selecionar golpe;
- visualizar tipo;
- visualizar poder;
- visualizar categoria;
- utilizar golpes com `power = 0`.

## Busca

Não carregar o catálogo inteiro no cliente.

Usar consultas limitadas/paginadas, como:

```text
GET /api/pokemon?search=char&limit=20
GET /api/moves?search=bra&limit=20
```

## Cálculo

O fluxo esperado:

```text
Frontend
↓
POST /api/damage/calculate
↓
FastAPI
↓
core Python
↓
DamageResult
↓
Frontend
```

O frontend não deve ser a fonte de verdade do cálculo depois da integração.

---

# 13. API V3

Endpoints previstos:

```http
GET  /api/types
GET  /api/pokemon
GET  /api/pokemon/{id}
GET  /api/pokemon/{id}/stats?level=N
GET  /api/moves
GET  /api/moves/{id}
POST /api/damage/calculate
```

Não alterar contratos sem autorização.

---

# 14. Variáveis de ambiente

O frontend deve usar:

```text
VITE_API_URL
```

Nunca hardcode da URL de produção dentro de componentes.

Em desenvolvimento, utilizar a URL local da API.

Em produção, utilizar a URL pública do backend.

---

# 15. CORS

Configurar CORS explicitamente.

Permitir:

- origem local do frontend durante desenvolvimento;
- origem oficial do frontend em produção.

Não liberar origens indiscriminadamente sem justificativa.

---

# 16. Integração com banco

O frontend não acessa PostgreSQL diretamente.

O fluxo obrigatório é:

```text
Frontend
↓
FastAPI
↓
services / core
↓
PostgreSQL
```

A sincronização da PokéAPI ocorre separadamente.

Durante o uso normal:

```text
Usuário
↓
FastAPI
↓
PostgreSQL
```

Não consultar a PokéAPI a cada requisição de usuário.

---

# 17. Hospedagem planejada

Frontend:

```text
Cloudflare Workers
```

Backend:

```text
Railway
```

Banco:

```text
PostgreSQL no Railway
```

Arquitetura:

```text
Cloudflare Workers
        ↓ HTTPS
FastAPI / Railway
        ↓
PostgreSQL / Railway
```

Não tentar executar FastAPI diretamente no Cloudflare Workers como runtime Python de propósito geral.

---

# 18. Dependências e ambiente

Manter as versões compatíveis com o ambiente atual.

O ambiente local utiliza Python 3.14.

Dependências relevantes já ajustadas para esse ambiente:

```text
psycopg2-binary==2.9.13
sqlalchemy==2.0.52
```

Não alterar versões dessas dependências sem necessidade e justificativa.

---

# 19. Ambiente local conhecido

O projeto é desenvolvido em:

```text
Windows
PowerShell
VS Code
```

O ambiente virtual pode ser executado diretamente por:

```powershell
.venv\Scripts\python.exe -m <comando>
```

Não presumir que `Activate.ps1` existe.

Docker Desktop precisa estar aberto antes de executar comandos Docker.

---

# 20. PostgreSQL local

Container conhecido:

```text
pokemon-rpg-db
```

Configuração local:

```text
usuário: pokemon
senha: pokemon
banco: pokemon_rpg
porta: 5432
```

Não destruir nem recriar esse banco automaticamente.

Se for necessário recriar o ambiente, pedir autorização antes.

---

# 21. Dataset PokéAPI

O clone local do dump está em:

```text
backend/api-data/
```

Não clonar novamente se o diretório já estiver presente.

Estrutura esperada:

```text
api-data/
└── data/
    └── api/
        └── v2/
```

O script deve continuar idempotente.

---

# 22. Escopo que NÃO deve ser implementado automaticamente

Não implementar nesta V3 sem nova autorização:

- login;
- usuários;
- campanhas;
- fichas;
- histórico;
- inventário;
- sistema completo de batalha;
- sistema completo de habilidades;
- sistema completo de itens;
- formas alternativas de Pokémon;
- Nature configurável;
- endpoint público de sincronização;
- qualquer funcionalidade administrativa não especificada.

---

# 23. Histórico do projeto

## V1

Calculadora inicial.

## V2.0.0

Redesign + React/TypeScript/Vite + testes + GitHub + deploy.

## V3

Backend + API + PostgreSQL + PokéAPI + cálculo no backend + integração completa com frontend.

A V3 só deve ser considerada concluída quando:

- catálogo das gerações 1–9 estiver validado;
- backend estiver completo;
- frontend estiver integrado;
- cálculo estiver sendo realizado pelo backend;
- fluxo completo estiver funcionando localmente;
- backend estiver publicado;
- frontend em produção estiver consumindo a API;
- testes e validações finais estiverem concluídos.

---

# 24. Regra de mudanças arquiteturais

Qualquer proposta que envolva mudança significativa deve ser apresentada antes da implementação.

Formato recomendado:

```text
PROPOSTA
Motivo:
Impacto:
Arquivos:
Riscos:
Alternativas:
```

Aguardar autorização.

---

# 25. Regra de mudanças no core

O core representa regras de negócio do RPG.

Não:

- reescrever por estilo;
- simplificar regras;
- mudar fórmulas;
- trocar multiplicadores;
- alterar arredondamento;
- remover testes;
- adaptar regras do jogo oficial Pokémon sem autorização.

O código pode ser refatorado somente quando:

- a tarefa autorizada exigir;
- a regra final permanecer idêntica;
- os testes continuarem cobrindo o comportamento.

---

# 26. Regra de sincronização

Antes de alterar o processo de sincronização:

1. explicar o motivo;
2. explicar os impactos;
3. explicar o que acontecerá com os dados existentes;
4. aguardar autorização.

O sync deve continuar:

- idempotente;
- repetível;
- rastreável;
- sem duplicação;
- sem destruir dados existentes sem autorização.

---

# 27. Regra para sugestões

Sugestões são permitidas.

Implementação automática de sugestões que alterem escopo ou arquitetura não é permitida.

Quando houver uma melhoria potencial:

```text
Sugestão:
...

Motivo:
...

Impacto:
...

Implementar somente mediante autorização.
```

---

# 28. Regra de encerramento de tarefa

Uma tarefa não deve ser considerada concluída apenas porque o código foi alterado.

Sempre que aplicável, validar com:

- testes;
- typecheck;
- lint;
- build;
- testes manuais;
- consultas ao banco;
- chamadas HTTP;
- verificação de integração.

Relatar exatamente o que foi executado.

Nunca afirmar que um teste foi executado se ele não foi.

---

# 29. Regra de ouro

> Implementar somente o que foi autorizado.
>
> Preservar as regras existentes.
>
> Não destruir dados.
>
> Não alterar arquitetura por conta própria.
>
> Validar antes de considerar concluído.
>
> Explicar antes de fazer mudanças importantes.
