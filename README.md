# Calculadora de Dano — RPG Pokémon (V1 · versão mesclada)

Calculadora de dano para um RPG inspirado em Pokémon. Esta é a primeira
versão (V1): um MVP funcional e modular, com cálculo manual, mas com uma
arquitetura já preparada para evoluir (banco de dados, cadastro de
Pokémon/golpes, campanhas, histórico de batalhas etc.) sem precisar ser
reescrita.

> **A fórmula de dano usada aqui é uma regra própria deste projeto.**
> Ela **não** reproduz a fórmula interna dos jogos oficiais de Pokémon.

Este projeto nasceu da fusão de duas implementações independentes feitas
a partir do mesmo documento de regras, pegando o melhor de cada uma — ver
[seção "Origem desta versão"](#origem-desta-versão) no final.

---

## Fórmula

```
Dano Base = (Poder do golpe ÷ 10) × (Ataque relevante ÷ Defesa relevante)
```

- Golpe físico → `ATK ÷ DEF`
- Golpe especial → `Sp. ATK ÷ Sp. DEF`

```
Dano Final = Dano Base × STAB × Efetividade × Crítico × Modificador
```

### Ordem dos cálculos

1. Aplicar modificações de atributos (valores absolutos, não percentuais)
2. Calcular Dano Base
3. Aplicar STAB
4. Aplicar efetividade de tipo
5. Aplicar crítico
6. Aplicar Modificador
7. Arredondar o Dano Final (único ponto de arredondamento)

### STAB (Same Type Attack Bonus)

`×1.5` se o tipo do golpe for igual ao Tipo 1 **ou** ao Tipo 2 do atacante.
Caso contrário, `×1`. O bônus **não acumula** mesmo com dois tipos batendo.

### Efetividade de tipo

Tabela moderna de 18 tipos (`src/data/typeChart.ts`), com multiplicadores
`2` (super efetivo), `1` (normal), `0.5` (pouco efetivo) e `0` (imune). A
matriz é **explícita** (todas as 18×18 combinações preenchidas), não
esparsa — evita bugs silenciosos por combinações esquecidas. Contra um
defensor de dois tipos, os multiplicadores de cada tipo se **multiplicam**
entre si (ex.: `2 × 2 = 4`, ou `0.5 × 0.5 = 0.25`).

### Crítico

Checkbox simples: marcado = `×1.5`, desmarcado = `×1`. Sem chance
aleatória, níveis de crítico ou habilidades relacionadas nesta versão.

### Modificador

Campo livre chamado apenas **"Modificador"**, `>= 0`, padrão `1`. Serve
para o usuário representar manualmente qualquer efeito que ainda não tenha
sistema próprio (habilidade, item, clima, regra de campanha etc.). É
aplicado por último.

### Atributos e defesa mínima

- ATK, DEF, Sp. ATK, Sp. DEF e Poder devem ser `>= 0`. Valores negativos
  são rejeitados na validação.
- ATK/Sp. ATK podem ser `0` (resulta em dano base `0`).
- A defesa **efetivamente usada na divisão** nunca é menor que `1`, mesmo
  que o valor original ou modificado seja `0` ou negativo — evita divisão
  por zero. O valor de entrada em si continua sendo validado como `>= 0`.

### Golpes sem dano (Poder = 0)

Um golpe com `power === 0` é tratado como um movimento sem dano direto. O
motor não calcula dano ofensivo, mas modificações de atributo (ex.: baixar
a DEF do alvo) continuam sendo aplicadas e exibidas, e um campo opcional de
**Efeito** (texto livre, ex. "DEF do alvo -2") pode ser exibido junto ao
resultado. Não há sistema de status conditions (burn, poison, sleep etc.)
nesta V1 — isso fica para versões futuras.

### Arredondamento

Nenhum multiplicador intermediário é arredondado. Somente o **Dano Final**
é arredondado, usando **round-half-up** (metades arredondam para cima —
ex.: `8.5 → 9`), e nunca fica abaixo de `0`.

---

## Arquitetura

```
Interface (React)
    ↓
Motor de cálculo (src/core)
    ↓
Regras (validators, typeCalculator, modifierCalculator)
    ↓
Dados (src/data — tabela de tipos, cores de tipo)
```

O motor de cálculo (`src/core/`) não importa nada de React, HTML ou CSS.
Ele valida a própria entrada (`calculateDamage` chama `validateBattleInput`
e lança um `Error` para entrada inválida) e pode ser chamado diretamente
por testes, por uma futura API, por um bot de Discord etc., sem duplicar
lógica nem depender da interface para garantir dados corretos.

```
src/
├── core/                       # motor de cálculo — independente de UI
│   ├── models.ts                # modelos de dados (Attacker, Move, Defender...)
│   ├── damageCalculator.ts      # orquestra o cálculo completo (valida + calcula)
│   ├── typeCalculator.ts        # STAB e efetividade de tipo
│   ├── modifierCalculator.ts    # modificações de atributo e crítico
│   ├── validators.ts            # validação da entrada (usada pelo motor E pela UI)
│   ├── formatResult.ts          # formata o resultado como texto (copiar/Discord/bot)
│   └── index.ts                 # barrel público do motor
│
├── data/                        # dados puros, sem lógica
│   ├── types.ts                 # catálogo dos 18 tipos + rótulos de exibição
│   ├── typeChart.ts             # tabela de efetividade (matriz 18×18 explícita)
│   └── typeColors.ts            # cores por tipo (só para exibição)
│
├── frontend/                    # camada de interface (React) — só apresenta
│   ├── components/
│   │   ├── AttackerPanel.tsx
│   │   ├── MovePanel.tsx
│   │   ├── DefenderPanel.tsx
│   │   ├── ModifiersPanel.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── Panel.tsx
│   │   ├── StatField.tsx
│   │   ├── TextField.tsx
│   │   └── TypeSelect.tsx
│   └── lib/
│       └── buildInput.ts        # converte estado dos painéis (strings) em DamageInput
│
├── tests/
│   └── damageCalculator.test.ts # 32 testes automatizados (Vitest)
│
├── App.tsx                      # integra formulário + motor de cálculo
└── App.css / index.css          # estilos
```

### Preparação para o futuro

- A tabela e o catálogo de tipos estão centralizados em `src/data/`. No
  futuro, podem ser substituídos por JSON externo ou banco de dados sem
  alterar o motor de cálculo.
- Os modelos (`Attacker`, `Move`, `Defender`) já separam conceitualmente
  dados de "espécie" (tipos, nome) de dados de "instância" (atributos,
  modificadores), preparando o terreno para uma futura distinção entre
  Pokémon Species e Pokémon Instance.
- O motor retorna um objeto estruturado (`DamageResult`) com todos os
  multiplicadores e detalhes — reutilizável por qualquer interface futura
  (web, bot de Discord, aplicativo, API).
- `Move.effects` já existe no modelo (ex.: Tail Whip → "DEF do alvo -2")
  e é transportado/exibido pela UI, mas não resolvido automaticamente —
  pronto para um futuro `EffectResolver`.

### O que NÃO foi implementado nesta V1 (por design)

Login, usuários, campanhas, banco de dados, inventário, habilidades
complexas, itens, status conditions completos, turnos de batalha, histórico
de batalhas, API externa, catálogo completo de Pokémon, sistema completo de
golpes. A arquitetura foi pensada para permitir todas essas extensões sem
reescrever o núcleo.

---

## Como executar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

## Como testar

```bash
npm run test        # roda a suíte uma vez
npm run test:watch  # modo watch
npm run typecheck   # checagem de tipos (tsc)
npm run lint        # oxlint
```

A suíte cobre: cálculo físico e especial, STAB ativado/desativado, defensor
de um e dois tipos (incluindo 4x, 0.25x e imunidade 0x), crítico,
modificador (1/2/0), ATK = 0, DEF = 0, defesa modificada abaixo de 1, golpe
de poder 0, alteração absoluta de atributo, tipo 2 vazio, entradas
inválidas (incluindo tipo/categoria inválidos), a política de
arredondamento (incluindo round-half-up) e a consistência da tabela de
tipos — além do exemplo oficial do documento de regras (Charmander usa
Ember em Bulbasaur, crítico ativado → **36 de dano**).

## Como buildar para produção

```bash
npm run build
```

Gera os arquivos estáticos em `dist/`.

---

## Exemplo de cálculo

```
Atacante: Charmander (Fire)
Golpe: Ember — Fire, Especial, Poder 40
Defensor: Bulbasaur (Grass) — Sp. DEF 10
Crítico: ativado | Modificador: 1

Dano Base = (40 / 10) × (20 / 10) = 8
STAB = ×1.5           (Fire bate com o tipo do atacante)
Efetividade = ×2       (Fire → Grass)
Crítico = ×1.5
Modificador = ×1

Dano Final = 8 × 1.5 × 2 × 1.5 × 1 = 36
```

---

## Limitações atuais da V1

- Sem persistência: cada cálculo é feito manualmente, nada é salvo.
- Sem catálogo de Pokémon/golpes — os campos de nome são apenas informativos.
- Sem chance de crítico, níveis de crítico ou habilidades que afetam
  crítico/STAB (ex.: Adaptability).
- Sem sistema de status conditions (burn, poison, sleep, paralysis, freeze,
  confusion) como mecânicas independentes — apenas o campo genérico
  "Modificador", o campo de texto livre "Efeito" e efeitos simples de
  alteração de atributo.
- Velocidade não participa do cálculo de dano.

## Possíveis extensões futuras

- Repositórios (`PokemonRepository`, `MoveRepository`, `ItemRepository`,
  `AbilityRepository`, `CampaignRepository`) substituindo os dados locais.
- Cadastro completo de Pokémon, golpes, itens e habilidades.
- Sistema de campanhas, jogadores, NPCs e histórico de batalhas.
- Status conditions completos como sistema independente, via um
  `EffectResolver` que consuma `move.effects`.
- Distinção entre Pokémon Species e Pokémon Instance.
- Reuso do mesmo motor de cálculo em um bot de Discord, app mobile ou API.

---

## Origem desta versão

Duas implementações independentes ("V-A" e "V-B") foram feitas a partir do
mesmo documento de regras. Esta versão mescla as duas, decisão por decisão:

**Da V-B (base do motor, mais robusta):**
- `calculateDamage` valida a própria entrada e lança erro — não depende
  apenas da UI para barrar dados inválidos (importante se o motor for
  reaproveitado por uma API/bot futuramente).
- Validação mais rigorosa: checa número finito (não só não-negativo) e se
  o tipo pertence à lista oficial dos 18 tipos.
- `TYPE_CHART` como matriz 18×18 **explícita**, em vez de tabela esparsa
  com valor-padrão implícito.
- `core/index.ts` como barrel público do motor.
- `roundFinalDamage` nomeado e documentado como política explícita
  (round-half-up).
- O campo de efeito livre do golpe (`move.effects`), inspirado no exemplo
  "Tail Whip" do documento de regras.

**Da V-A (stack e UI):**
- React 19 / Vite 8 / TypeScript ~6, com `oxlint` configurado.
- A interface "ticket-style" dos painéis (`Panel`, `StatField`,
  `TypeSelect`, `ResultPanel` com linhas numeradas e detalhamento de
  efetividade) e o botão "Copiar resultado".
- `formatResultAsText`, promovido para dentro do `core` (formatResult.ts)
  por ser lógica de apresentação independente de UI, reaproveitável por um
  futuro bot/API — em vez de viver acoplado ao estado do formulário.

O objetivo é manter os pontos fortes de ambas: um motor defensivo e bem
testado, rodando sobre um stack atual, com uma UI que já segue de perto o
layout sugerido pelo documento de regras (seção "Interface").
