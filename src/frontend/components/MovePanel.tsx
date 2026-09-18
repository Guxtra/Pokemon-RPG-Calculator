import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { StatField } from "./StatField";
import { TextField } from "./TextField";
import { TypeSelect } from "./TypeSelect";
import { CatalogSearch } from "./CatalogSearch";
import { type MoveListItem } from "../lib/api";

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
  movesCatalog: MoveListItem[];
}

export function MovePanel({ state, onChange, errors, movesCatalog }: MovePanelProps) {
  const [selected, setSelected] = useState<MoveListItem | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const set = <K extends keyof MoveFormState>(key: K, value: MoveFormState[K]) =>
    onChange({ ...state, [key]: value });

  useEffect(() => {
    if (!selected) return;

    setCatalogLoading(true);
    setCatalogError(null);

    // Preenche os campos com o golpe selecionado
    onChange({
      ...state,
      name: selected.name,
      type: selected.type,
      category: selected.category,
      power: String(selected.power),
    });

    return () => {
      setCatalogLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <Panel title="Golpe" tag="PWR">
      <div className="catalog-loader">
        <CatalogSearch
          items={movesCatalog}
          getId={(m) => m.pokeapi_id}
          getLabel={(m) => m.name}
          getSubLabel={(m) => `PWR ${m.power} · ${m.category}`}
          onSelect={(m) => setSelected(m)}
          placeholder="Buscar golpe (nome)"
          selectedLabel={selected ? `${selected.name} (PWR ${selected.power})` : undefined}
        />
        {catalogLoading && <p className="catalog-status">Carregando golpe…</p>}
        {catalogError && <p className="catalog-error">{catalogError}</p>}
      </div>

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
