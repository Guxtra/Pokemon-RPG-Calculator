/**
 * validators — validação da entrada do motor de cálculo.
 *
 * O motor valida tudo o que recebe, inclusive vindo de outras origens
 * que não a interface (ex.: uma futura API ou bot). A interface usa
 * estas mesmas regras para exibir mensagens amigáveis junto aos campos.
 */

import { TYPE_IDS } from "../data/types";
import type { DamageInput, MoveCategory, PokemonType } from "./models";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_CATEGORIES: MoveCategory[] = ["PHYSICAL", "SPECIAL"];

/** Valida um valor numérico obrigatório e não negativo. */
function validateRequiredNonNegative(value: unknown, fieldLabel: string): string | null {
  if (value === null || value === undefined || value === "" || Number.isNaN(value)) {
    return `Informe ${fieldLabel}.`;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${fieldLabel} deve ser um número.`;
  }
  if (value < 0) {
    return `${fieldLabel} deve ser um número maior ou igual a 0.`;
  }
  return null;
}

/** Valida um valor numérico OPCIONAL (ausente é válido), mas se presente deve ser >= 0. */
function validateOptionalNonNegative(value: unknown, fieldLabel: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return `${fieldLabel} deve ser um número.`;
  }
  if (value < 0) {
    return `${fieldLabel} deve ser um número maior ou igual a 0.`;
  }
  return null;
}

/** Valida um tipo: obrigatório e pertencente aos 18 tipos válidos. */
function validateType(value: unknown, fieldLabel: string): string | null {
  if (!value) return `${fieldLabel} é obrigatório.`;
  if (!TYPE_IDS.includes(value as PokemonType)) return `${fieldLabel} inválido.`;
  return null;
}

/** Valida que um Tipo 2 opcional não seja idêntico ao Tipo 1. */
function validateDistinctTypes(
  type1: PokemonType | undefined,
  type2: PokemonType | undefined,
  fieldLabel: string
): string | null {
  if (type1 && type2 && type1 === type2) {
    return `${fieldLabel} não pode ser igual ao Tipo 1.`;
  }
  return null;
}

/**
 * Valida a entrada completa de um cálculo de dano.
 *
 * Regras cobertas: ATK/DEF/Sp.ATK/Sp.DEF/Poder >= 0; Modificador
 * opcional mas >= 0 quando informado; tipos válidos e obrigatórios
 * (Tipo 1 do atacante/defensor, tipo do golpe); categoria obrigatória
 * e válida; Tipo 2 (atacante ou defensor) não pode repetir o Tipo 1.
 */
export function validateBattleInput(input: DamageInput): ValidationResult {
  const errors: ValidationError[] = [];
  const { attacker, move, defender, modifiers } = input;
  const push = (field: string, message: string | null) => {
    if (message) errors.push({ field, message });
  };

  push("attacker.atk", validateRequiredNonNegative(attacker.atk, "ATK"));
  push("attacker.spAtk", validateRequiredNonNegative(attacker.spAtk, "Sp. ATK"));
  push("defender.def", validateRequiredNonNegative(defender.def, "DEF"));
  push("defender.spDef", validateRequiredNonNegative(defender.spDef, "Sp. DEF"));
  push("move.power", validateRequiredNonNegative(move.power, "Poder"));
  push("modifiers.multiplier", validateOptionalNonNegative(modifiers.multiplier, "Modificador"));

  push("attacker.type1", validateType(attacker.type1, "Tipo 1 do atacante"));
  push("move.type", validateType(move.type, "Tipo do golpe"));
  push("defender.type1", validateType(defender.type1, "Tipo 1 do defensor"));

  if (!move.category) {
    push("move.category", "Categoria do golpe é obrigatória.");
  } else if (!VALID_CATEGORIES.includes(move.category)) {
    push("move.category", "Categoria do golpe inválida.");
  }

  push(
    "attacker.type2",
    validateDistinctTypes(attacker.type1, attacker.type2, "Tipo 2 do atacante")
  );
  push(
    "defender.type2",
    validateDistinctTypes(defender.type1, defender.type2, "Tipo 2 do defensor")
  );

  return { valid: errors.length === 0, errors };
}
