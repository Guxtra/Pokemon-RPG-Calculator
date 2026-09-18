import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { PokemonPanel, EMPTY_POKEMON, type PokemonFormState } from "./frontend/components/PokemonPanel";
import { DirectionToggle } from "./frontend/components/DirectionToggle";
import { MovePanel, EMPTY_MOVE, type MoveFormState } from "./frontend/components/MovePanel";
import { ModifiersPanel, EMPTY_MODIFIERS, type ModifiersFormState } from "./frontend/components/ModifiersPanel";
import { ResultPanel } from "./frontend/components/ResultPanel";
import { buildDamageInput, resolveBattleRoles, type Direction } from "./frontend/lib/buildInput";
import { getPokemonList, getMoves, calculateDamageViaApi, type PokemonListItem, type MoveListItem, ApiError } from "./frontend/lib/api";
import { validateBattleInput } from "./core/validators";
import type { DamageResult } from "./core/models";

export default function App() {
  const [yourPokemon, setYourPokemon] = useState<PokemonFormState>(EMPTY_POKEMON);
  const [opponent, setOpponent] = useState<PokemonFormState>(EMPTY_POKEMON);
  const [direction, setDirection] = useState<Direction>("yourPokemonAttacks");
  const [move, setMove] = useState<MoveFormState>(EMPTY_MOVE);
  const [modifiers, setModifiers] = useState<ModifiersFormState>(EMPTY_MODIFIERS);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DamageResult | null>(null);
  const [calculationCount, setCalculationCount] = useState(0);
  const [invalidPulse, setInvalidPulse] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Catálogo de Pokémon carregado uma vez e compartilhado pelos dois painéis — o
  // modo Catálogo de cada um filtra essa lista localmente, sem bater
  // na API por tecla digitada.
  const [pokemonCatalog, setPokemonCatalog] = useState<PokemonListItem[]>([]);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // Catálogo de golpes carregado uma vez
  const [movesCatalog, setMovesCatalog] = useState<MoveListItem[]>([]);
  const [movesCatalogLoadError, setMovesCatalogLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPokemonList()
      .then((list) => {
        if (!cancelled) setPokemonCatalog(list);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogLoadError(
            "Não consegui carregar o catálogo de Pokémon. O modo Manual continua funcionando normalmente."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMoves()
      .then((list) => {
        if (!cancelled) setMovesCatalog(list);
      })
      .catch(() => {
        if (!cancelled) {
          setMovesCatalogLoadError(
            "Não consegui carregar o catálogo de golpes. O modo Manual continua funcionando normalmente."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { attackerState, defenderState } = useMemo(
    () => resolveBattleRoles(yourPokemon, opponent, direction),
    [yourPokemon, opponent, direction]
  );

  const damageInput = useMemo(
    () => buildDamageInput(attackerState, move, defenderState, modifiers),
    [attackerState, move, defenderState, modifiers]
  );

  const handleToggleDirection = () => {
    setDirection((d) => (d === "yourPokemonAttacks" ? "opponentAttacks" : "yourPokemonAttacks"));
    setErrors({});
    setResult(null);
  };

  const handleCalculate = async () => {
    const validation = validateBattleInput(damageInput);
    if (!validation.valid) {
      const map: Record<string, string> = {};
      validation.errors.forEach((e) => {
        map[e.field] = e.message;
      });
      setErrors(map);
      setResult(null);
      setInvalidPulse(true);
      setTimeout(() => setInvalidPulse(false), 300);
      return;
    }
    setErrors({});
    setCalculating(true);
    setResult(null);
    try {
      const apiResult = await calculateDamageViaApi(damageInput);
      setResult(apiResult);
      setCalculationCount((c) => c + 1);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const map: Record<string, string> = {};
        err.errors.forEach((e) => {
          map[e.field] = e.message;
        });
        setErrors(map);
      } else {
        setErrors({ general: err instanceof Error ? err.message : "Erro ao calcular dano via API." });
      }
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Calculadora de Dano</h1>
        <p className="app-subtitle">
          RPG inspirado em Pokémon — fórmula própria do projeto, não o cálculo oficial dos jogos.
        </p>
        {catalogLoadError && <p className="app-catalog-warning">{catalogLoadError}</p>}
        {movesCatalogLoadError && <p className="app-catalog-warning">{movesCatalogLoadError}</p>}
      </header>

      <main className="app-grid">
        <PokemonPanel
          title="Seu Pokémon"
          role={direction === "yourPokemonAttacks" ? "attacker" : "defender"}
          state={yourPokemon}
          onChange={setYourPokemon}
          errors={errors}
          pokemonCatalog={pokemonCatalog}
        />
        <div className="app-center-column">
          <DirectionToggle direction={direction} onToggle={handleToggleDirection} />
          <MovePanel state={move} onChange={setMove} errors={errors} movesCatalog={movesCatalog} />
        </div>
        <PokemonPanel
          title="Pokémon Adversário"
          role={direction === "yourPokemonAttacks" ? "defender" : "attacker"}
          state={opponent}
          onChange={setOpponent}
          errors={errors}
          pokemonCatalog={pokemonCatalog}
        />
      </main>

      <div className="app-modifiers-row">
        <ModifiersPanel state={modifiers} onChange={setModifiers} errors={errors} />

        <div className="calculate-block">
          <button
            type="button"
            className={`calculate-button${invalidPulse ? " is-invalid" : ""}${calculating ? " is-loading" : ""}`}
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? "⏳ Calculando..." : "⚔ Calcular Dano"}
          </button>
          {Object.keys(errors).length > 0 && (
            <p className="calculate-error-note">
              Corrija os campos destacados acima para calcular.
            </p>
          )}
        </div>
      </div>

      {result && (
        <ResultPanel
          key={calculationCount}
          result={result}
          attackerName={attackerState.name}
          moveName={move.name}
          defenderName={defenderState.name}
          moveEffect={move.effect}
        />
      )}

      <footer className="app-footer">
        <span>Calculadora de Dano · V1 · Núcleo de cálculo testado e independente da interface</span>
      </footer>
    </div>
  );
}
