/**
 * damageCalculator — motor central de cálculo de dano do RPG.
 *
 * FÓRMULA PRÓPRIA DO RPG (não reproduz o cálculo interno dos jogos Pokémon):
 *
 *   Dano Base = (Poder ÷ 10) × (Ataque relevante ÷ Defesa relevante)
 *     - Físico   → ATK ÷ DEF
 *     - Especial → Sp. ATK ÷ Sp. DEF
 *
 *   Dano Final = Dano Base × STAB × Efetividade × Crítico × Modificador
 *
 * ORDEM DE EXECUÇÃO:
 *   1. Aplicar modificações absolutas de atributos
 *   2. Calcular Dano Base
 *   3. Aplicar STAB
 *   4. Aplicar efetividade de tipo
 *   5. Aplicar crítico
 *   6. Aplicar Modificador
 *   7. Arredondar o Dano Final (e somente ele) para inteiro
 *
 * POLÍTICA DE ARREDONDAMENTO:
 *   - Precisão total (ponto flutuante) durante TODOS os cálculos intermediários.
 *   - Apenas o Dano Final é arredondado, para inteiro, com round-half-up
 *     (metades arredondam para cima — ex.: 8.5 → 9).
 *   - O resultado nunca fica abaixo de 0.
 *
 * Regras extras da V1: defesa efetiva na divisão tem piso mínimo de 1
 * (evita divisão por zero); ATK/Sp. ATK podem ser 0 (dano base 0);
 * Poder = 0 → movimento sem dano direto (isDamagingMove = false).
 *
 * O motor NÃO depende de HTML/CSS/React/banco de dados — pode ser
 * executado isoladamente (Node, testes, uma futura API, um bot de
 * Discord etc.), sem duplicar lógica em cada consumidor.
 */

import { applyStatModifier, calculateCritical, normalizeMultiplier } from "./modifierCalculator";
import { calculateStab, calculateTypeEffectiveness } from "./typeCalculator";
import { validateBattleInput } from "./validators";
import type { DamageInput, DamageResult } from "./models";

/** Piso mínimo da defesa usada na divisão. */
export const MIN_EFFECTIVE_DEFENSE = 1;

/** Fator fixo da fórmula do RPG: Poder ÷ 10. */
export const POWER_DIVISOR = 10;

/**
 * Dano Base = (Poder / 10) × (Ataque relevante / Defesa relevante).
 * Retorna 0 para golpe com Poder = 0.
 */
export function calculateBaseDamage(
  power: number,
  effectiveAttack: number,
  effectiveDefense: number
): number {
  if (power === 0) return 0;
  return (power / POWER_DIVISOR) * (effectiveAttack / effectiveDefense);
}

/**
 * Arredonda o dano final para inteiro: round-half-up (metade arredonda
 * para cima), com piso 0. Único ponto de arredondamento do motor.
 */
export function roundFinalDamage(value: number): number {
  if (value <= 0) return 0;
  return Math.floor(value + 0.5);
}

/**
 * Combina todos os multiplicadores na ordem definida pelas regras e
 * arredonda apenas o resultado final.
 */
export function calculateFinalDamage(
  baseDamage: number,
  stabMultiplier: number,
  effectivenessMultiplier: number,
  criticalMultiplier: number,
  otherMultiplier: number
): number {
  const rawDamage =
    baseDamage * stabMultiplier * effectivenessMultiplier * criticalMultiplier * otherMultiplier;
  return roundFinalDamage(rawDamage);
}

/**
 * Ponto de entrada do motor. Valida a entrada e lança um `Error` (com a
 * lista de problemas) se ela for inválida — o motor não confia apenas na
 * validação feita pela interface, pois pode ser chamado por qualquer
 * consumidor futuro (API, bot, testes) sem passar pela UI.
 *
 * @throws {Error} se a entrada for inválida.
 */
export function calculateDamage(input: DamageInput): DamageResult {
  const validation = validateBattleInput(input);
  if (!validation.valid) {
    const summary = validation.errors.map((e) => `- ${e.message}`).join("\n");
    throw new Error(`Entrada inválida:\n${summary}`);
  }

  const { attacker, move, defender, modifiers } = input;
  const isPhysical = move.category === "PHYSICAL";
  const isDamagingMove = move.power > 0;

  // 1) Modificações absolutas de atributos (sempre aplicadas, mesmo sem
  //    dano, pois um golpe de poder 0 pode alterar atributos do defensor).
  const attackDetail = applyStatModifier(
    isPhysical ? attacker.atk : attacker.spAtk,
    isPhysical ? attacker.statModifiers?.atk ?? 0 : attacker.statModifiers?.spAtk ?? 0,
    0
  );
  const defenseDetail = applyStatModifier(
    isPhysical ? defender.def : defender.spDef,
    isPhysical ? defender.statModifiers?.def ?? 0 : defender.statModifiers?.spDef ?? 0,
    MIN_EFFECTIVE_DEFENSE
  );

  const criticalMultiplier = calculateCritical(modifiers.critical);
  const otherMultiplier = normalizeMultiplier(modifiers.multiplier);

  let baseDamage = 0;
  let stabMultiplier = 1;
  let effectivenessMultiplier = 1;
  let effectivenessBreakdown: DamageResult["effectivenessBreakdown"] = [];
  let finalDamage = 0;

  if (isDamagingMove) {
    // 2) Dano Base
    baseDamage = calculateBaseDamage(move.power, attackDetail.effective, defenseDetail.effective);

    // 3) STAB
    stabMultiplier = calculateStab(attacker, move.type);

    // 4) Efetividade de tipo
    const effectiveness = calculateTypeEffectiveness(move.type, defender);
    effectivenessMultiplier = effectiveness.multiplier;
    effectivenessBreakdown = effectiveness.breakdown;

    // 5, 6 e 7) Crítico, Modificador e arredondamento final
    finalDamage = calculateFinalDamage(
      baseDamage,
      stabMultiplier,
      effectivenessMultiplier,
      criticalMultiplier,
      otherMultiplier
    );
  }

  return {
    isDamagingMove,
    baseDamage,
    effectiveAttack: attackDetail.effective,
    effectiveDefense: defenseDetail.effective,
    stabMultiplier,
    effectivenessMultiplier,
    criticalMultiplier,
    otherMultiplier,
    finalDamage,
    effectiveStats: {
      atk: isPhysical ? attackDetail.modified : attacker.atk,
      spAtk: !isPhysical ? attackDetail.modified : attacker.spAtk,
      def: isPhysical ? defenseDetail.modified : defender.def,
      spDef: !isPhysical ? defenseDetail.modified : defender.spDef,
    },
    attackDetail,
    defenseDetail,
    effectivenessBreakdown,
  };
}
