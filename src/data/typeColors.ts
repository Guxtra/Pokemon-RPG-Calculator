import type { PokemonType } from "../core/models";

/**
 * Paleta de cores por tipo, usada apenas para exibição na interface
 * (chips, destaques). Não tem nenhuma relação com o cálculo de dano.
 */
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: "#9A9A82",
  fire: "#E4622C",
  water: "#3E8FD0",
  electric: "#E0B32A",
  grass: "#5FA53A",
  ice: "#5FCBD8",
  fighting: "#B5484B",
  poison: "#9750A6",
  ground: "#B08347",
  flying: "#8FA9E8",
  psychic: "#E0537A",
  bug: "#93B32A",
  rock: "#A8964F",
  ghost: "#63588F",
  dragon: "#5A5AD6",
  dark: "#5B5464",
  steel: "#8E97A6",
  fairy: "#E091C4",
};
