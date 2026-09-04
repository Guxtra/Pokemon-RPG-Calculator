/**
 * Testes do motor de cálculo (damageCalculator).
 *
 * Cobre os 20 cenários obrigatórios do documento de regras, o exemplo
 * oficial (Charmander/Ember vs Grass com crítico = 36), validações de
 * entrada, consistência da tabela de tipos e a política de arredondamento.
 */
import { describe, it, expect } from "vitest";
import { calculateDamage, roundFinalDamage } from "../core/damageCalculator";
import { validateBattleInput } from "../core/validators";
import { TYPE_CHART } from "../data/typeChart";
import { TYPE_IDS } from "../data/types";
import type { Attacker, DamageInput, Defender, BattleModifiers, Move } from "../core/models";

function makeAttacker(overrides: Partial<Attacker> = {}): Attacker {
  return { type1: "fire", atk: 20, spAtk: 20, ...overrides };
}
function makeMove(overrides: Partial<Move> = {}): Move {
  return { type: "fire", category: "SPECIAL", power: 40, ...overrides };
}
function makeDefender(overrides: Partial<Defender> = {}): Defender {
  return { type1: "grass", def: 10, spDef: 10, ...overrides };
}
function makeModifiers(overrides: Partial<BattleModifiers> = {}): BattleModifiers {
  return { critical: false, multiplier: 1, ...overrides };
}
function makeInput(overrides: {
  attacker?: Partial<Attacker>;
  move?: Partial<Move>;
  defender?: Partial<Defender>;
  modifiers?: Partial<BattleModifiers>;
} = {}): DamageInput {
  return {
    attacker: makeAttacker(overrides.attacker),
    move: makeMove(overrides.move),
    defender: makeDefender(overrides.defender),
    modifiers: makeModifiers(overrides.modifiers),
  };
}

describe("Exemplo oficial do documento de regras (Charmander vs Bulbasaur)", () => {
  it("Ember crítico contra Grass resulta em 36 de dano", () => {
    const input = makeInput({
      attacker: { type1: "fire", atk: 0, spAtk: 20 },
      move: { type: "fire", category: "SPECIAL", power: 40 },
      defender: { type1: "grass", def: 0, spDef: 10 },
      modifiers: { critical: true, multiplier: 1 },
    });
    const result = calculateDamage(input);
    expect(result.baseDamage).toBe(8);
    expect(result.stabMultiplier).toBe(1.5);
    expect(result.effectivenessMultiplier).toBe(2);
    expect(result.criticalMultiplier).toBe(1.5);
    expect(result.otherMultiplier).toBe(1);
    expect(result.finalDamage).toBe(36);
  });
});

describe("Teste 1: cálculo básico físico", () => {
  it("usa ATK / DEF para golpes físicos", () => {
    const input = makeInput({
      attacker: { type1: "normal", atk: 30, spAtk: 5 },
      move: { type: "normal", category: "PHYSICAL", power: 20 },
      defender: { type1: "rock", def: 15, spDef: 5 },
    });
    const result = calculateDamage(input);
    expect(result.baseDamage).toBe(4); // (20/10) * (30/15)
  });
});

describe("Teste 2: cálculo básico especial", () => {
  it("usa Sp.ATK / Sp.DEF para golpes especiais", () => {
    const input = makeInput({
      attacker: { type1: "water", atk: 5, spAtk: 40 },
      move: { type: "water", category: "SPECIAL", power: 30 },
      defender: { type1: "rock", def: 5, spDef: 20 },
    });
    const result = calculateDamage(input);
    expect(result.baseDamage).toBe(6); // (30/10) * (40/20)
  });
});

describe("Teste 3: STAB ativado", () => {
  it("aplica 1.5 quando o tipo do golpe é igual a um dos tipos do atacante", () => {
    const input = makeInput({
      attacker: { type1: "fire", type2: "flying", atk: 10, spAtk: 10 },
      move: { type: "fire", category: "PHYSICAL", power: 10 },
    });
    expect(calculateDamage(input).stabMultiplier).toBe(1.5);
  });

  it("não acumula mesmo com dois tipos do atacante batendo (teto 1.5)", () => {
    const input = makeInput({
      attacker: { type1: "fire", type2: "flying", atk: 10, spAtk: 10 },
      move: { type: "fire", category: "PHYSICAL", power: 10 },
    });
    expect(calculateDamage(input).stabMultiplier).toBe(1.5);
  });
});

describe("Teste 4: STAB desativado", () => {
  it("mantém 1 quando o tipo do golpe não corresponde a nenhum tipo do atacante", () => {
    const input = makeInput({
      attacker: { type1: "water", type2: "flying", atk: 10, spAtk: 10 },
      move: { type: "fire", category: "PHYSICAL", power: 10 },
    });
    expect(calculateDamage(input).stabMultiplier).toBe(1);
  });
});

describe("Teste 5: defensor com um tipo", () => {
  it("usa apenas o multiplicador do Tipo 1", () => {
    const input = makeInput({
      move: { type: "water", category: "SPECIAL", power: 10 },
      defender: { type1: "fire" },
    });
    const result = calculateDamage(input);
    expect(result.effectivenessMultiplier).toBe(2);
    expect(result.effectivenessBreakdown).toHaveLength(1);
  });
});

describe("Teste 6: defensor com dois tipos e efetividade 4x", () => {
  it("multiplica os dois multiplicadores (Water vs Fire/Rock)", () => {
    const input = makeInput({
      move: { type: "water", category: "SPECIAL", power: 10 },
      defender: { type1: "fire", type2: "rock" },
    });
    const result = calculateDamage(input);
    expect(result.effectivenessMultiplier).toBe(4);
    expect(result.effectivenessBreakdown).toEqual([
      { defenseType: "fire", multiplier: 2 },
      { defenseType: "rock", multiplier: 2 },
    ]);
  });
});

describe("Teste 7: defensor com dois tipos e efetividade 0.25x", () => {
  it("multiplica 0.5 x 0.5 (Water vs Water/Grass)", () => {
    const input = makeInput({
      move: { type: "water", category: "SPECIAL", power: 10 },
      defender: { type1: "water", type2: "grass" },
    });
    expect(calculateDamage(input).effectivenessMultiplier).toBe(0.25);
  });
});

describe("Teste 8: imunidade 0x", () => {
  it("Normal vs Ghost resulta em dano final 0", () => {
    const input = makeInput({
      attacker: { type1: "normal", atk: 50, spAtk: 5 },
      move: { type: "normal", category: "PHYSICAL", power: 50 },
      defender: { type1: "ghost", def: 1, spDef: 5 },
    });
    const result = calculateDamage(input);
    expect(result.effectivenessMultiplier).toBe(0);
    expect(result.finalDamage).toBe(0);
  });
});

describe("Teste 9: crítico ativado", () => {
  it("aplica multiplicador 1.5", () => {
    const input = makeInput({ modifiers: { critical: true, multiplier: 1 } });
    expect(calculateDamage(input).criticalMultiplier).toBe(1.5);
  });
});

describe("Teste 10: crítico desativado", () => {
  it("mantém multiplicador 1", () => {
    const input = makeInput({ modifiers: { critical: false, multiplier: 1 } });
    expect(calculateDamage(input).criticalMultiplier).toBe(1);
  });
});

describe("Teste 11: Modificador 1", () => {
  it("não altera o dano em relação ao padrão", () => {
    const input = makeInput({ modifiers: { critical: false, multiplier: 1 } });
    const withDefaultMultiplier = calculateDamage({
      ...input,
      modifiers: { critical: false, multiplier: undefined },
    });
    expect(calculateDamage(input).finalDamage).toBe(withDefaultMultiplier.finalDamage);
  });
});

describe("Teste 12: Modificador 2", () => {
  it("dobra o dano final em relação ao modificador 1", () => {
    const base = calculateDamage(makeInput({ modifiers: { critical: false, multiplier: 1 } }));
    const doubled = calculateDamage(makeInput({ modifiers: { critical: false, multiplier: 2 } }));
    expect(doubled.finalDamage).toBe(base.finalDamage * 2);
  });
});

describe("Teste 13: Modificador 0", () => {
  it("zera o dano final", () => {
    const input = makeInput({ modifiers: { critical: false, multiplier: 0 } });
    expect(calculateDamage(input).finalDamage).toBe(0);
  });
});

describe("Teste 14: ATK = 0", () => {
  it("resulta em dano base 0 para golpe físico", () => {
    const input = makeInput({
      attacker: { type1: "normal", atk: 0, spAtk: 10 },
      move: { type: "normal", category: "PHYSICAL", power: 40 },
    });
    const result = calculateDamage(input);
    expect(result.baseDamage).toBe(0);
    expect(result.finalDamage).toBe(0);
  });
});

describe("Teste 15: DEF = 0", () => {
  it("usa defesa efetiva mínima de 1 no cálculo", () => {
    const input = makeInput({
      move: { type: "normal", category: "PHYSICAL", power: 10 },
      defender: { type1: "rock", def: 0, spDef: 10 },
    });
    expect(calculateDamage(input).effectiveDefense).toBe(1);
  });
});

describe("Teste 16: DEF modificada abaixo de 1", () => {
  it("mantém a defesa efetiva em 1 mesmo com modificação negativa forte", () => {
    const input = makeInput({
      move: { type: "normal", category: "PHYSICAL", power: 10 },
      defender: { type1: "rock", def: 2, spDef: 10, statModifiers: { def: -5 } },
    });
    const result = calculateDamage(input);
    expect(result.defenseDetail.modified).toBe(-3);
    expect(result.effectiveDefense).toBe(1);
  });
});

describe("Teste 17: golpe com poder 0", () => {
  it("não calcula dano ofensivo e marca isDamagingMove como falso", () => {
    const input = makeInput({ move: { type: "normal", category: "PHYSICAL", power: 0 } });
    const result = calculateDamage(input);
    expect(result.isDamagingMove).toBe(false);
    expect(result.baseDamage).toBe(0);
    expect(result.finalDamage).toBe(0);
  });
});

describe("Teste 18: alteração absoluta de atributo", () => {
  it("aplica a modificação antes do cálculo do dano base", () => {
    const input = makeInput({
      attacker: { type1: "normal", atk: 20, spAtk: 5, statModifiers: { atk: 5 } },
      move: { type: "normal", category: "PHYSICAL", power: 10 },
      defender: { type1: "normal", def: 10, spDef: 10 },
    });
    const result = calculateDamage(input);
    expect(result.attackDetail.original).toBe(20);
    expect(result.attackDetail.modified).toBe(25);
    expect(result.effectiveAttack).toBe(25);
    expect(result.baseDamage).toBe(2.5); // (10/10) * (25/10)
  });
});

describe("Teste 19: Tipo 2 vazio", () => {
  it("considera o atacante/defensor de tipo único", () => {
    const input = makeInput({
      attacker: { type1: "fire", type2: undefined, atk: 10, spAtk: 10 },
      defender: { type1: "grass", type2: undefined, def: 10, spDef: 10 },
    });
    expect(calculateDamage(input).effectivenessBreakdown).toHaveLength(1);
  });
});

describe("Teste 20: entrada inválida", () => {
  it("rejeita ATK negativo", () => {
    const input = makeInput({ attacker: { type1: "normal", atk: -5, spAtk: 10 } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "attacker.atk")).toBe(true);
    expect(() => calculateDamage(input)).toThrow();
  });

  it("rejeita Poder negativo", () => {
    const input = makeInput({ move: { type: "normal", category: "PHYSICAL", power: -10 } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "move.power")).toBe(true);
  });

  it("rejeita Modificador negativo", () => {
    const input = makeInput({ modifiers: { critical: false, multiplier: -1 } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "modifiers.multiplier")).toBe(true);
  });

  it("rejeita Tipo 2 igual ao Tipo 1 no atacante", () => {
    const input = makeInput({ attacker: { type1: "fire", type2: "fire", atk: 10, spAtk: 10 } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "attacker.type2")).toBe(true);
  });

  it("rejeita tipo do golpe inválido", () => {
    const input = makeInput({ move: { type: "plasma" as never, category: "PHYSICAL", power: 10 } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "move.type")).toBe(true);
  });

  it("rejeita categoria inválida", () => {
    const input = makeInput({ move: { category: "MENTAL" as never } });
    const validation = validateBattleInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.field === "move.category")).toBe(true);
  });
});

describe("Arredondamento", () => {
  it("não arredonda valores intermediários, apenas o dano final", () => {
    const input = makeInput({
      attacker: { type1: "water", atk: 5, spAtk: 23 },
      move: { type: "water", category: "SPECIAL", power: 33 },
      defender: { type1: "fire", def: 5, spDef: 7 },
    });
    const result = calculateDamage(input);
    expect(Number.isInteger(result.baseDamage)).toBe(false);
    expect(Number.isInteger(result.finalDamage)).toBe(true);
    expect(result.finalDamage).toBeGreaterThanOrEqual(0);
  });

  it("usa round-half-up: 8.5 arredonda para 9", () => {
    expect(roundFinalDamage(8.5)).toBe(9);
    expect(roundFinalDamage(8.49)).toBe(8);
  });

  it("nunca retorna dano negativo", () => {
    expect(roundFinalDamage(-3)).toBe(0);
  });
});

describe("typeChart — consistência de dados", () => {
  it("possui exatamente os 18 tipos como linhas e colunas", () => {
    expect(Object.keys(TYPE_CHART)).toHaveLength(18);
    for (const attackType of TYPE_IDS) {
      expect(Object.keys(TYPE_CHART[attackType])).toHaveLength(18);
    }
  });

  it("confere multiplicadores-chave da referência", () => {
    expect(TYPE_CHART.water.fire).toBe(2);
    expect(TYPE_CHART.water.rock).toBe(2);
    expect(TYPE_CHART.water.grass).toBe(0.5);
    expect(TYPE_CHART.normal.ghost).toBe(0);
    expect(TYPE_CHART.fighting.ghost).toBe(0);
    expect(TYPE_CHART.electric.ground).toBe(0);
    expect(TYPE_CHART.dragon.fairy).toBe(0);
  });
});
