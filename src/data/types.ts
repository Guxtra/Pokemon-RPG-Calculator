/**
 * Catálogo dos 18 tipos modernos e seus rótulos de exibição.
 *
 * Dado puro: nenhuma regra de cálculo vive aqui. No futuro este arquivo
 * poderá ser substituído por JSON → banco de dados → API sem tocar no motor.
 */

import type { PokemonType } from "../core/models";

export interface TypeInfo {
  id: PokemonType;
  label: string;
}

export const TYPE_IDS: PokemonType[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

const TYPE_LABELS_PT: Record<PokemonType, string> = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Grama",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Veneno",
  ground: "Terrestre",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada",
};

export const TYPES: TypeInfo[] = TYPE_IDS.map((id) => ({
  id,
  label: TYPE_LABELS_PT[id],
}));

/** Índice rápido id → rótulo de exibição. */
export const TYPE_LABELS: Record<PokemonType, string> = Object.fromEntries(
  TYPES.map((t) => [t.id, t.label])
) as Record<PokemonType, string>;
