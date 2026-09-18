import { describe, expect, it } from "vitest";
import { resolveBattleRoles } from "../frontend/lib/buildInput";
import { EMPTY_POKEMON, type PokemonFormState } from "../frontend/components/PokemonPanel";

function makePokemon(overrides: Partial<PokemonFormState>): PokemonFormState {
  return { ...EMPTY_POKEMON, ...overrides };
}

describe("resolveBattleRoles", () => {
  const yourPokemon = makePokemon({
    name: "Charmander",
    type1: "fire",
    atk: "52",
    def: "43",
    spAtk: "60",
    spDef: "50",
    modAtk: "1",
    modDef: "2",
  });

  const opponent = makePokemon({
    name: "Squirtle",
    type1: "water",
    atk: "48",
    def: "65",
    spAtk: "50",
    spDef: "64",
    modDef: "3",
  });

  it("quando 'Seu Pokémon' ataca, usa os stats de ATK dele e os de DEF do adversário", () => {
    const { attackerState, defenderState } = resolveBattleRoles(
      yourPokemon,
      opponent,
      "yourPokemonAttacks"
    );

    expect(attackerState.name).toBe("Charmander");
    expect(attackerState.atk).toBe("52");
    expect(attackerState.spAtk).toBe("60");
    expect(attackerState.modAtk).toBe("1");

    expect(defenderState.name).toBe("Squirtle");
    expect(defenderState.def).toBe("65");
    expect(defenderState.spDef).toBe("64");
    expect(defenderState.modDef).toBe("3");
  });

  it("quando o adversário ataca, os papéis invertem sem alterar os dados guardados", () => {
    const { attackerState, defenderState } = resolveBattleRoles(
      yourPokemon,
      opponent,
      "opponentAttacks"
    );

    expect(attackerState.name).toBe("Squirtle");
    expect(attackerState.atk).toBe("48");
    expect(attackerState.spAtk).toBe("50");

    expect(defenderState.name).toBe("Charmander");
    expect(defenderState.def).toBe("43");
    expect(defenderState.spDef).toBe("50");
    expect(defenderState.modDef).toBe("2");
  });

  it("nenhum dos dois painéis perde dados ao trocar de direção (só a seleção de papel muda)", () => {
    const attacking = resolveBattleRoles(yourPokemon, opponent, "yourPokemonAttacks");
    const defending = resolveBattleRoles(yourPokemon, opponent, "opponentAttacks");

    // O DEF do seu Pokémon nunca foi enviado como defenderState quando
    // ele ataca, mas o dado original (yourPokemon.def) continua intacto
    // — resolveBattleRoles não muta os painéis de entrada.
    expect(yourPokemon.def).toBe("43");
    expect(attacking.attackerState.name).toBe("Charmander");
    expect(defending.defenderState.name).toBe("Charmander");
    expect(defending.defenderState.def).toBe(yourPokemon.def);
  });
});
