interface StatFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}

/**
 * Campo numérico com rótulo e mensagem de erro exibida imediatamente
 * abaixo do campo (requisito de UX: erros próximos aos campos).
 */
export function StatField({
  label,
  value,
  onChange,
  error,
  required = false,
  step = "any",
  placeholder,
}: StatFieldProps) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      <input
        className={`field-input${error ? " field-input-error" : ""}`}
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
