import { TYPE_IDS, TYPE_LABELS } from "../../data/types";
import { TYPE_COLORS } from "../../data/typeColors";
import type { PokemonType } from "../../core/models";

interface TypeSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  allowNone?: boolean;
}

/**
 * Seletor de tipo (um dos 18 tipos válidos). Quando allowNone é
 * verdadeiro, oferece a opção "Nenhum" para representar Tipo 2 vazio.
 */
export function TypeSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  allowNone = false,
}: TypeSelectProps) {
  const dotColor = value ? TYPE_COLORS[value as PokemonType] : "transparent";

  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      <div className="type-select-wrap">
        <span className="type-dot" style={{ background: dotColor }} aria-hidden />
        <select
          className={`field-input type-select${error ? " field-input-error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {allowNone && <option value="">Nenhum</option>}
          {!allowNone && (
            <option value="" disabled hidden>
              Selecionar…
            </option>
          )}
          {TYPE_IDS.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
