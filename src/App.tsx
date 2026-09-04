import { useMemo, useState } from "react";
import "./App.css";
import { AttackerPanel, EMPTY_ATTACKER, type AttackerFormState } from "./frontend/components/AttackerPanel";
import { MovePanel, EMPTY_MOVE, type MoveFormState } from "./frontend/components/MovePanel";
import { DefenderPanel, EMPTY_DEFENDER, type DefenderFormState } from "./frontend/components/DefenderPanel";
import { ModifiersPanel, EMPTY_MODIFIERS, type ModifiersFormState } from "./frontend/components/ModifiersPanel";
import { ResultPanel } from "./frontend/components/ResultPanel";
import { buildDamageInput } from "./frontend/lib/buildInput";
import { calculateDamage } from "./core/damageCalculator";
import { validateBattleInput } from "./core/validators";
import type { DamageResult } from "./core/models";

export default function App() {
  const [attacker, setAttacker] = useState<AttackerFormState>(EMPTY_ATTACKER);
  const [move, setMove] = useState<MoveFormState>(EMPTY_MOVE);
  const [defender, setDefender] = useState<DefenderFormState>(EMPTY_DEFENDER);
  const [modifiers, setModifiers] = useState<ModifiersFormState>(EMPTY_MODIFIERS);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DamageResult | null>(null);
  const [calculationCount, setCalculationCount] = useState(0);

  const damageInput = useMemo(
    () => buildDamageInput(attacker, move, defender, modifiers),
    [attacker, move, defender, modifiers]
  );

  const handleCalculate = () => {
    const validation = validateBattleInput(damageInput);
    if (!validation.valid) {
      const map: Record<string, string> = {};
      validation.errors.forEach((e) => {
        map[e.field] = e.message;
      });
      setErrors(map);
      setResult(null);
      return;
    }
    setErrors({});
    setResult(calculateDamage(damageInput));
    setCalculationCount((c) => c + 1);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Calculadora de Dano</h1>
        <p className="app-subtitle">
          RPG inspirado em Pokémon — fórmula própria do projeto, não o cálculo oficial dos jogos.
        </p>
      </header>

      <main className="app-grid">
        <AttackerPanel state={attacker} onChange={setAttacker} errors={errors} />
        <MovePanel state={move} onChange={setMove} errors={errors} />
        <DefenderPanel state={defender} onChange={setDefender} errors={errors} />
      </main>

      <div className="app-modifiers-row">
        <ModifiersPanel state={modifiers} onChange={setModifiers} errors={errors} />

        <div className="calculate-block">
          <button type="button" className="calculate-button" onClick={handleCalculate}>
            Calcular Dano
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
          attackerName={attacker.name}
          moveName={move.name}
          defenderName={defender.name}
          moveEffect={move.effect}
        />
      )}

      <footer className="app-footer">
        <span>Calculadora de Dano · V1 · Núcleo de cálculo testado e independente da interface</span>
      </footer>
    </div>
  );
}
