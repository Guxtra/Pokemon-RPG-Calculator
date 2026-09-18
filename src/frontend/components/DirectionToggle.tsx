import type { Direction } from "../lib/buildInput";

interface DirectionToggleProps {
  direction: Direction;
  onToggle: () => void;
}

/**
 * Indicador central de direção do ataque + botão Trocar.
 *
 * Importante: isto só troca a DIREÇÃO (uma seta), nunca os dados dos
 * painéis. "Seu Pokémon" e "Pokémon Adversário" nunca mudam de lugar
 * nem de identidade — só a seta (e, por baixo, qual painel é
 * attacker/defender pro cálculo) inverte.
 */
export function DirectionToggle({ direction, onToggle }: DirectionToggleProps) {
  const yourPokemonAttacks = direction === "yourPokemonAttacks";

  return (
    <div className="direction-bar">
      <span className="direction-label">Seu Pokémon</span>
      <div className="direction-indicator">
        <span className="direction-verb">Atacando</span>
        <span
          className={`direction-arrow-line${yourPokemonAttacks ? "" : " direction-arrow-line-reverse"}`}
          aria-hidden
        >
          {yourPokemonAttacks ? "─────────▶" : "◀─────────"}
        </span>
      </div>
      <span className="direction-label">Pokémon Adversário</span>
      <button type="button" className="direction-swap-button" onClick={onToggle}>
        ⇄ Trocar
      </button>
    </div>
  );
}
