# Pokémon RPG Calculator

Calculadora de dano para um RPG inspirado em Pokémon, desenvolvida com React, TypeScript e Vite.

> **A fórmula de dano deste projeto é uma regra própria do RPG.** Ela não reproduz a fórmula interna dos jogos oficiais de Pokémon.

## ✨ Funcionalidades

- Cálculo de dano físico e especial
- STAB automático
- Efetividade de tipos com os 18 tipos modernos
- Tipos duplos do defensor
- Acerto crítico
- Modificador manual final
- Modificações absolutas de atributos
- Movimentos sem dano direto (`Poder = 0`)
- Validação de entradas
- Resultado detalhado do cálculo
- Testes automatizados com Vitest
- Interface responsiva

## 🧮 Fórmula

```text
Dano Base = (Poder ÷ 10) × (Ataque relevante ÷ Defesa relevante)

Físico  → ATK ÷ DEF
Especial → Sp. ATK ÷ Sp. DEF
```

```text
Dano Final = Dano Base × STAB × Efetividade × Crítico × Modificador
```

### Ordem do cálculo

1. Aplicar modificações de atributos
2. Calcular Dano Base
3. Aplicar STAB
4. Aplicar efetividade de tipo
5. Aplicar crítico
6. Aplicar Modificador
7. Arredondar somente o Dano Final

### Regras principais

**STAB:** `×1,5` quando o tipo do golpe corresponde a um dos tipos do atacante; o bônus não acumula.

**Crítico:** checkbox simples. Marcado = `×1,5`; desmarcado = `×1`.

**Modificador:** campo manual, com valor padrão `1` e valor mínimo `0`, aplicado por último.

**Atributos:** ATK, DEF, Sp. ATK, Sp. DEF e Poder aceitam valores `>= 0`. A defesa usada na divisão nunca fica abaixo de `1`.

**Poder = 0:** o movimento é tratado como sem dano direto, mas pode carregar efeitos de atributo para exibição.

## 🏗️ Arquitetura

```text
Interface (React)
        ↓
Motor de cálculo (src/core)
        ↓
Regras e validações
        ↓
Dados (src/data)
```

O motor em `src/core/` não depende de React, HTML, CSS ou banco de dados. Isso permite reutilizar a mesma lógica em testes, futuras APIs, bots ou outras interfaces.

```text
src/
├── core/
│   ├── models.ts
│   ├── damageCalculator.ts
│   ├── typeCalculator.ts
│   ├── modifierCalculator.ts
│   ├── validators.ts
│   ├── formatResult.ts
│   └── index.ts
│
├── data/
│   ├── types.ts
│   ├── typeChart.ts
│   └── typeColors.ts
│
├── frontend/
│   ├── components/
│   └── lib/
│
├── tests/
│   └── damageCalculator.test.ts
│
├── App.tsx
├── App.css
└── index.css
```

## 🚀 Como executar

Pré-requis: Node.js e npm instalados.

```bash
npm install
npm run dev
```

Depois abra o endereço local informado pelo Vite, normalmente:

```text
http://localhost:5173
```

## ✅ Verificações

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 🧪 Testes

O projeto possui testes automatizados para cálculo de dano, STAB, efetividade, crítico, modificadores, defesa mínima, movimentos sem dano e validações.

## 🗺️ Próximos passos

A arquitetura foi preparada para evoluir futuramente para:

- catálogo de Pokémon e golpes;
- banco de dados;
- contas e usuários;
- campanhas;
- fichas de Pokémon;
- histórico de batalhas;
- habilidades e itens;
- sistema de batalhas.

Esses recursos não fazem parte da V2 atual.

## 📌 Status

**V2 — redesign visual e organização para publicação como projeto de portfólio.**
