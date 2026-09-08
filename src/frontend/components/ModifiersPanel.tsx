import { Panel } from "./Panel";
import { StatField } from "./StatField";

export interface ModifiersFormState {
  critical: boolean;
  multiplier: string;
}

export const EMPTY_MODIFIERS: ModifiersFormState = {
  critical: false,
  multiplier: "1",
};

interface ModifiersPanelProps {
  state: ModifiersFormState;
  onChange: (state: ModifiersFormState) => void;
  errors: Record<string, string>;
}

export function ModifiersPanel({ state, onChange, errors }: ModifiersPanelProps) {
  return (
    <Panel title="Modificações" tag="×">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={state.critical}
          onChange={(e) => onChange({ ...state, critical: e.target.checked })}
        />
        Crítico
        <span className="category-hint">×1.5 quando marcado</span>
      </label>
      <StatField
        label="Modificador"
        value={state.multiplier}
        onChange={(v) => onChange({ ...state, multiplier: v })}
        placeholder="1"
        error={errors["modifiers.multiplier"]}
      />
      <p className="move-hint">
        Use este campo para representar manualmente efeitos que ainda não têm sistema
        próprio: habilidade, item, clima ou regra de campanha. 1 = sem alteração.
      </p>
    </Panel>
  );
}
