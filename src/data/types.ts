/**
 * Catálogo dos 18 tipos modernos e seus rótulos de exibição.
 *
 * Os IDs permanecem em inglês para uso interno; os nomes visíveis ao usuário
 * são definidos explicitamente em português.
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

export const TYPE_LABELS: Record<PokemonType, string> = {
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
  label: TYPE_LABELS[id],
}));
