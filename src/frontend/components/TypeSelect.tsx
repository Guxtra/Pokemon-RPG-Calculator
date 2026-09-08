import { useEffect, useId, useRef, useState } from "react";
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
 * Seletor de tipo apresentado como combobox acessível com chips
 * coloridos (usa TYPE_COLORS/TYPE_LABELS já existentes em src/data).
 *
 * Puramente visual/interativo: o valor armazenado continua sendo o
 * mesmo PokemonType (string) de sempre — nenhuma regra de identificação
 * de tipo foi alterada.
 */
export function TypeSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  allowNone = false,
}: TypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const options = allowNone ? ["", ...TYPE_IDS] : TYPE_IDS;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = Math.max(options.indexOf(value), 0);
      setActiveIndex(idx);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (open) {
      listRef.current?.focus();
    }
  }, [open]);

  const commitSelection = (index: number) => {
    onChange(options[index]);
    setOpen(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commitSelection(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const renderChip = (type: string) =>
    type ? (
      <span className="type-chip">
        <span className="type-dot" style={{ background: TYPE_COLORS[type as PokemonType] }} aria-hidden />
        {TYPE_LABELS[type as PokemonType]}
      </span>
    ) : (
      <span className="type-select-option-none">Nenhum</span>
    );

  return (
    <div className="field" ref={rootRef}>
      <span className="field-label" id={labelId}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      <div className="type-select">
        <button
          type="button"
          className={`type-select-trigger${error ? " field-input-error" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${labelId}`}
          aria-controls={listboxId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKeyDown}
        >
          {value ? (
            renderChip(value)
          ) : (
            <span className="type-select-trigger-placeholder">Selecionar…</span>
          )}
          <span className="type-select-caret" aria-hidden>
            ▾
          </span>
        </button>
        {open && (
          <ul
            className="type-select-listbox"
            role="listbox"
            id={listboxId}
            aria-labelledby={labelId}
            ref={listRef}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
          >
            {options.map((type, index) => (
              <li
                key={type || "none"}
                role="option"
                aria-selected={value === type}
                data-active={index === activeIndex}
                className="type-select-option"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(index)}
              >
                {renderChip(type)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
