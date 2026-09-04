import { Panel } from "./Panel";
import { StatField } from "./StatField";
import { TextField } from "./TextField";
import { TypeSelect } from "./TypeSelect";

export interface AttackerFormState {
  name: string;
  type1: string;
  type2: string;
  atk: string;
  spAtk: string;
  modAtk: string;
  modSpAtk: string;
}

export const EMPTY_ATTACKER: AttackerFormState = {
  name: "",
  type1: "",
  type2: "",
  atk: "",
  spAtk: "",
  modAtk: "",
  modSpAtk: "",
};

interface AttackerPanelProps {
  state: AttackerFormState;
  onChange: (state: AttackerFormState) => void;
  errors: Record<string, string>;
}

export function AttackerPanel({ state, onChange, errors }: AttackerPanelProps) {
  const set = <K extends keyof AttackerFormState>(key: K, value: string) =>
    onChange({ ...state, [key]: value });

  return (
    <Panel title="Atacante" tag="ATQ">
      <TextField
        label="Nome (opcional)"
        value={state.name}
        onChange={(v) => set("name", v)}
        placeholder="Ex.: Charmander"
      />
      <div className="field-row">
        <TypeSelect
          label="Tipo 1"
          value={state.type1}
          onChange={(v) => set("type1", v)}
          required
          error={errors["attacker.type1"]}
        />
        <TypeSelect
          label="Tipo 2"
          value={state.type2}
          onChange={(v) => set("type2", v)}
          allowNone
          error={errors["attacker.type2"]}
        />
      </div>
      <div className="field-row">
        <StatField
          label="ATK"
          value={state.atk}
          onChange={(v) => set("atk", v)}
          required
          error={errors["attacker.atk"]}
        />
        <StatField
          label="Sp. ATK"
          value={state.spAtk}
          onChange={(v) => set("spAtk", v)}
          required
          error={errors["attacker.spAtk"]}
        />
      </div>
      <div className="field-row field-row-muted">
        <StatField
          label="Modificação do ATK"
          value={state.modAtk}
          onChange={(v) => set("modAtk", v)}
          placeholder="0"
        />
        <StatField
          label="Modificação do Sp. ATK"
          value={state.modSpAtk}
          onChange={(v) => set("modSpAtk", v)}
          placeholder="0"
        />
      </div>
    </Panel>
  );
}
