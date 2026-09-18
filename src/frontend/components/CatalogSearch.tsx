import { useMemo, useState } from "react";
import { filterCatalogItems } from "../lib/catalogSearch";

interface CatalogSearchProps<T> {
  items: T[];
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  onSelect: (item: T) => void;
  placeholder?: string;
  selectedLabel?: string;
}

/**
 * Busca + seleção genérica sobre uma lista já carregada em memória.
 * Não é acoplado a Pokémon nem a Golpe — reaproveitado pelos dois.
 */
export function CatalogSearch<T>({
  items,
  getId,
  getLabel,
  getSubLabel,
  onSelect,
  placeholder = "Buscar...",
  selectedLabel,
}: CatalogSearchProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => filterCatalogItems(items, query, getId, getLabel, getSubLabel),
    [items, query, getId, getLabel, getSubLabel]
  );

  return (
    <div className="catalog-search">
      <input
        className="field-input"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={selectedLabel ?? placeholder}
      />
      {open && results.length > 0 && (
        <ul className="catalog-search-list">
          {results.map((item) => (
            <li key={getId(item)}>
              <button
                type="button"
                className="catalog-search-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {getLabel(item)}
                {getSubLabel && <span className="catalog-search-sub">{getSubLabel(item)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
