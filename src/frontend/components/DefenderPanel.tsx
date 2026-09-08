import { Panel } from "./Panel";
import { StatField } from "./StatField";
import { TextField } from "./TextField";
import { TypeSelect } from "./TypeSelect";

export interface DefenderFormState {
  name: string;
  type1: string;
  type2: string;
  def: string;
  spDef: string;
  modDef: string;
  modSpDef: string;
}

export const EMPTY_DEFENDER: DefenderFormState = {
  name: "",
  type1: "",
  type2: "",
  def: "",
  spDef: "",
  modDef: "",
  modSpDef: "",
};

interface DefenderPanelProps {
  state: DefenderFormState;
  onChange: (state: DefenderFormState) => void;
  errors: Record<string, string>;
}

export function DefenderPanel({ state, onChange, errors }: DefenderPanelProps) {
  const set = <K extends keyof DefenderFormState>(key: K, value: string) =>
    onChange({ ...state, [key]: value });

  return (
    <Panel title="Defensor" tag="DEF">
      <TextField
        label="Nome (opcional)"
        value={state.name}
        onChange={(v) => set("name", v)}
        placeholder="Bulbasaur"
      />
      <div className="field-row">
        <TypeSelect
          label="Tipo 1"
          value={state.type1}
          onChange={(v) => set("type1", v)}
          required
          error={errors["defender.type1"]}
        />
        <TypeSelect
          label="Tipo 2"
          value={state.type2}
          onChange={(v) => set("type2", v)}
          allowNone
          error={errors["defender.type2"]}
        />
      </div>
      <div className="field-row">
        <StatField
          label="DEF"
          value={state.def}
          onChange={(v) => set("def", v)}
          required
          error={errors["defender.def"]}
        />
        <StatField
          label="Sp. DEF"
          value={state.spDef}
          onChange={(v) => set("spDef", v)}
          required
          error={errors["defender.spDef"]}
        />
      </div>
      <div className="field-row field-row-muted">
        <StatField
          label="Modificação DEF"
          value={state.modDef}
          onChange={(v) => set("modDef", v)}
          placeholder="0"
        />
        <StatField
          label="Modificação Sp. DEF"
          value={state.modSpDef}
          onChange={(v) => set("modSpDef", v)}
          placeholder="0"
        />
      </div>
    </Panel>
  );
}
