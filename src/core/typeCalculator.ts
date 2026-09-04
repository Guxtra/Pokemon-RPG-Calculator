/**
 * typeCalculator — efetividade de tipos e STAB.
 *
 * Regra de efetividade: multiplicador contra o Tipo 1 do defensor ×
 * multiplicador contra o Tipo 2 (quando houver). Acesso é sempre
 * data-driven (TYPE_CHART[tipoAtaque][tipoDefensor]) — nenhum
 * `if (tipo === "fire")` vive aqui nem em nenhum outro lugar do motor.
 */

import { TYPE_CHART } from "../data/typeChart";
import type { Attacker, EffectivenessBreakdownEntry, PokemonType } from "./models";

export const STAB_MULTIPLIER = 1.5;

/** Tipo(s) de uma criatura, ignorando Tipo 2 ausente. */
function typesOf(entity: { type1: PokemonType; type2?: PokemonType }): PokemonType[] {
  const types: PokemonType[] = [entity.type1];
  if (entity.type2 && entity.type2 !== entity.type1) {
    types.push(entity.type2);
  }
  return types;
}

/**
 * STAB (Same Type Attack Bonus), automático.
 *
 * ×1.5 se o tipo do golpe corresponder ao Tipo 1 OU ao Tipo 2 do
 * atacante; ×1 caso contrário. O bônus NÃO acumula mesmo que o
 * atacante tenha dois tipos batendo com o golpe.
 */
export function calculateStab(attacker: Attacker, moveType: PokemonType): number {
  return typesOf(attacker).includes(moveType) ? STAB_MULTIPLIER : 1;
}

export interface EffectivenessResult {
  /** Produto dos multiplicadores de cada tipo do defensor. */
  multiplier: number;
  /** Detalhe por tipo do defensor, para auditoria/exibição. */
  breakdown: EffectivenessBreakdownEntry[];
}

/**
 * Efetividade de tipo do golpe contra o(s) tipo(s) do defensor.
 *
 * Se o defensor tiver dois tipos, os multiplicadores contra cada tipo
 * se multiplicam entre si (ex.: 2× × 2× = 4×, ou 0.5× × 0.5× = 0.25×).
 */
export function calculateTypeEffectiveness(
  moveType: PokemonType,
  defender: { type1: PokemonType; type2?: PokemonType }
): EffectivenessResult {
  const breakdown: EffectivenessBreakdownEntry[] = typesOf(defender).map((defenseType) => ({
    defenseType,
    multiplier: TYPE_CHART[moveType][defenseType],
  }));

  const multiplier = breakdown.reduce((acc, entry) => acc * entry.multiplier, 1);

  return { multiplier, breakdown };
}
