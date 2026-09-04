/**
 * modifierCalculator — modificações ABSOLUTAS de atributos e crítico.
 *
 * Regra da V1: valores absolutos (soma/subtração), não estágios oficiais.
 *   ATK efetivo = ATK + mod   (idem DEF, Sp. ATK, Sp. DEF)
 *
 * As modificações são aplicadas ANTES do cálculo do dano base.
 */

import type { EffectiveStatDetail, StatModifiers } from "./models";

export const CRITICAL_MULTIPLIER = 1.5;

/**
 * Aplica uma modificação absoluta a um único atributo, retornando o
 * detalhamento completo (original → modificação → modificado → efetivo)
 * para exibição/auditoria na interface.
 *
 * `minimumForCalculation` garante que o valor usado na divisão nunca
 * seja menor que esse piso (usado para DEF/Sp.DEF, que não podem ser 0
 * na divisão). Para ATK/Sp.ATK, o piso é 0 — eles podem legitimamente
 * resultar em dano base 0.
 */
export function applyStatModifier(
  original: number,
  modification = 0,
  minimumForCalculation = 0
): EffectiveStatDetail {
  const modified = original + modification;
  const effective = Math.max(modified, minimumForCalculation);
  return { original, modification, modified, effective };
}

/** Normaliza modificadores parciais (ex.: { def: -3 }) preenchendo zeros. */
export function normalizeStatModifiers(mods: Partial<StatModifiers> | undefined): StatModifiers {
  return {
    atk: mods?.atk ?? 0,
    def: mods?.def ?? 0,
    spAtk: mods?.spAtk ?? 0,
    spDef: mods?.spDef ?? 0,
  };
}

/** Multiplicador de crítico: 1.5 se ativado, 1 caso contrário (V1: apenas checkbox). */
export function calculateCritical(isCritical: boolean): number {
  return isCritical ? CRITICAL_MULTIPLIER : 1;
}

/** Normaliza o campo "Modificador": valor padrão 1 quando ausente/indefinido. */
export function normalizeMultiplier(multiplier: number | undefined | null): number {
  if (multiplier === undefined || multiplier === null || Number.isNaN(multiplier)) {
    return 1;
  }
  return multiplier;
}
