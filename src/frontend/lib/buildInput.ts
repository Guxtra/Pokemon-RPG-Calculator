/**
 * buildInput — camada de parsing da interface.
 *
 * Converte o estado dos painéis (sempre strings, para os inputs) em um
 * DamageInput tipado para o motor. Não contém nenhuma regra de negócio:
 * apenas parsing de texto → número/tipo. A validação de negócio (>= 0,
 * tipos válidos, Tipo 2 distinto etc.) é feita exclusivamente por
 * `validateBattleInput`, no `core` — a interface não duplica essa lógica.
 */
import type { DamageInput, PokemonType } from "../../core/models";
import type { AttackerFormState } from "../components/AttackerPanel";
import type { MoveFormState } from "../components/MovePanel";
import type { DefenderFormState } from "../components/DefenderPanel";
import type { ModifiersFormState } from "../components/ModifiersPanel";

/** Campo numérico obrigatório: string vazia vira NaN (validators.ts rejeita e explica). */
function parseRequiredNumber(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") return NaN;
  return Number(trimmed);
}

/** Campo numérico opcional: string vazia vira o padrão informado. */
function parseOptionalNumber(value: string, fallback = 0): number {
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  const n = Number(trimmed);
  return Number.isNaN(n) ? fallback : n;
}

export function buildDamageInput(
  attacker: AttackerFormState,
  move: MoveFormState,
  defender: DefenderFormState,
  modifiers: ModifiersFormState
): DamageInput {
  return {
    attacker: {
      name: attacker.name.trim() || undefined,
      type1: attacker.type1 as PokemonType,
      type2: attacker.type2 ? (attacker.type2 as PokemonType) : undefined,
      atk: parseRequiredNumber(attacker.atk),
      spAtk: parseRequiredNumber(attacker.spAtk),
      statModifiers: {
        atk: parseOptionalNumber(attacker.modAtk),
        spAtk: parseOptionalNumber(attacker.modSpAtk),
      },
    },
    move: {
      name: move.name.trim() || undefined,
      type: move.type as PokemonType,
      category: move.category,
      power: parseRequiredNumber(move.power),
      effects: move.effect.trim() ? [{ description: move.effect.trim() }] : undefined,
    },
    defender: {
      name: defender.name.trim() || undefined,
      type1: defender.type1 as PokemonType,
      type2: defender.type2 ? (defender.type2 as PokemonType) : undefined,
      def: parseRequiredNumber(defender.def),
      spDef: parseRequiredNumber(defender.spDef),
      statModifiers: {
        def: parseOptionalNumber(defender.modDef),
        spDef: parseOptionalNumber(defender.modSpDef),
      },
    },
    modifiers: {
      critical: modifiers.critical,
      multiplier: modifiers.multiplier.trim() === "" ? undefined : Number(modifiers.multiplier),
    },
  };
}
