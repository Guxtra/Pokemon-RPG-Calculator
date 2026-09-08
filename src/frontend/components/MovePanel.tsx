import { Panel } from "./Panel";
import { StatField } from "./StatField";
import { TextField } from "./TextField";
import { TypeSelect } from "./TypeSelect";

export interface MoveFormState {
  name: string;
  type: string;
  category: "PHYSICAL" | "SPECIAL";
  power: string;
  effect: string;
}

export const EMPTY_MOVE: MoveFormState = {
  name: "",
  type: "",
  category: "PHYSICAL",
  power: "",
  effect: "",
};

interface MovePanelProps {
  state: MoveFormState;
  onChange: (state: MoveFormState) => void;
  errors: Record<string, string>;
}

export function MovePanel({ state, onChange, errors }: MovePanelProps) {
  const set = <K extends keyof MoveFormState>(key: K, value: MoveFormState[K]) =>
    onChange({ ...state, [key]: value });

  return (
    <Panel title="Golpe" tag="PWR">
      <TextField
        label="Nome (opcional)"
        value={state.name}
        onChange={(v) => set("name", v)}
        placeholder="Ember"
      />
      <div className="field-row">
        <TypeSelect
          label="Tipo do golpe"
          value={state.type}
          onChange={(v) => set("type", v)}
          required
          error={errors["move.type"]}
        />
        <StatField
          label="Poder"
          value={state.power}
          onChange={(v) => set("power", v)}
          required
          error={errors["move.power"]}
        />
      </div>
      <fieldset className="field category-field">
        <span className="field-label">
          Categoria<span className="field-required">*</span>
        </span>
        <div className="category-options">
          <label
            className={`category-option${state.category === "PHYSICAL" ? " category-option-active" : ""}`}
          >
            <input
              type="radio"
              name="category"
              checked={state.category === "PHYSICAL"}
              onChange={() => set("category", "PHYSICAL")}
            />
            Físico
            <span className="category-hint">ATK / DEF</span>
          </label>
          <label
            className={`category-option${state.category === "SPECIAL" ? " category-option-active" : ""}`}
          >
            <input
              type="radio"
              name="category"
              checked={state.category === "SPECIAL"}
              onChange={() => set("category", "SPECIAL")}
            />
            Especial
            <span className="category-hint">Sp.ATK / Sp.DEF</span>
          </label>
        </div>
        {errors["move.category"] && <span className="field-error">{errors["move.category"]}</span>}
      </fieldset>
      <TextField
        label="Efeito (opcional, apenas exibição)"
        value={state.effect}
        onChange={(v) => set("effect", v)}
        placeholder="Ex.: DEF do alvo -2"
      />
      {state.power.trim() === "0" && (
        <p className="move-hint">
          Poder 0 é tratado como um movimento sem dano direto. O cálculo de dano será
          ignorado; se houver modificação de atributo ou efeito, eles ainda serão exibidos.
        </p>
      )}
    </Panel>
  );
}
