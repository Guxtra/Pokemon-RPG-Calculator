import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { StatField } from "./StatField";
import { TextField } from "./TextField";
import { TypeSelect } from "./TypeSelect";
import { CatalogSearch } from "./CatalogSearch";
import { ApiError, getPokemonStats, type PokemonListItem } from "../lib/api";

export interface PokemonFormState {
  name: string;
  type1: string;
  type2: string;
  atk: string;
  def: string;
  spAtk: string;
  spDef: string;
  modAtk: string;
  modDef: string;
  modSpAtk: string;
  modSpDef: string;
}

export const EMPTY_POKEMON: PokemonFormState = {
  name: "",
  type1: "",
  type2: "",
  atk: "",
  def: "",
  spAtk: "",
  spDef: "",
  modAtk: "",
  modDef: "",
  modSpAtk: "",
  modSpDef: "",
};

/** Papel do painel NA JOGADA ATUAL — não confundir com a identidade do painel (title), que nunca muda. */
export type BattleRole = "attacker" | "defender";

interface PokemonPanelProps {
  title: string;
  role: BattleRole;
  state: PokemonFormState;
  onChange: (state: PokemonFormState) => void;
  errors: Record<string, string>;
  /** Lista completa do catálogo (GET /api/pokemon), buscada uma vez no App e compartilhada pelos dois painéis. */
  pokemonCatalog: PokemonListItem[];
}

/**
 * Painel de um Pokémon com identidade FIXA ("Seu Pokémon" ou "Pokémon
 * Adversário" — decidido pelo `title`, de fora).
 *
 * Modo Catálogo x Manual: em qualquer um dos dois, os mesmos campos
 * (Nome, Tipos, ATK/DEF/Sp.ATK/Sp.DEF) ficam visíveis e editáveis — o
 * Catálogo só ADICIONA um buscador + campo de nível que, ao carregar,
 * PRÉ-PREENCHE esses campos a partir de GET /api/pokemon/{id}/stats.
 * Depois de carregado, o usuário pode editar livremente sem alterar o
 * catálogo oficial (decisão aprovada da V3).
 */
export function PokemonPanel({
  title,
  role,
  state,
  onChange,
  errors,
  pokemonCatalog,
}: PokemonPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState<"manual" | "catalog">("manual");
  const [level, setLevel] = useState("50");
  const [selected, setSelected] = useState<PokemonListItem | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const set = <K extends keyof PokemonFormState>(key: K, value: string) =>
    onChange({ ...state, [key]: value });

  const isAttacking = role === "attacker";

  useEffect(() => {
    if (mode !== "catalog" || !selected) return;

    const levelNum = Number(level);
    if (!Number.isInteger(levelNum) || levelNum < 1 || levelNum > 100) return;

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    getPokemonStats(selected.pokeapi_id, levelNum)
      .then((stats) => {
        if (cancelled) return;
        onChange({
          ...state,
          name: stats.name,
          type1: stats.type1,
          type2: stats.type2 ?? "",
          atk: String(stats.atk),
          def: String(stats.def),
          spAtk: String(stats.spAtk),
          spDef: String(stats.spDef),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCatalogError(err instanceof ApiError ? err.message : "Erro ao buscar stats do catálogo.");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected, level]);

  return (
    <Panel title={title} tag={isAttacking ? "ATACA" : "DEFENDE"}>
      <div className="mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
          className={`mode-toggle-option${mode === "manual" ? " mode-toggle-option-active" : ""}`}
          onClick={() => setMode("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "catalog"}
          className={`mode-toggle-option${mode === "catalog" ? " mode-toggle-option-active" : ""}`}
          onClick={() => setMode("catalog")}
        >
          Catálogo
        </button>
      </div>

      {mode === "catalog" && (
        <div className="catalog-loader">
          <CatalogSearch
            items={pokemonCatalog}
            getId={(p) => p.pokeapi_id}
            getLabel={(p) => p.name}
            getSubLabel={(p) => `#${p.national_dex_number}`}
            onSelect={(p) => setSelected(p)}
            placeholder="Buscar Pokémon (nome ou nº da Pokédex)"
            selectedLabel={selected ? `${selected.name} (#${selected.national_dex_number})` : undefined}
          />
          <StatField
            label="Nível"
            value={level}
            onChange={setLevel}
            required
            placeholder="1-100"
            error={catalogError ?? undefined}
          />
          {catalogLoading && <p className="catalog-status">Carregando stats do catálogo…</p>}
        </div>
      )}

      <TextField
        label="Nome (opcional)"
        value={state.name}
        onChange={(v) => set("name", v)}
        placeholder={isAttacking ? "Charmander" : "Bulbasaur"}
      />
      <div className="field-row">
        <TypeSelect
          label="Tipo 1"
          value={state.type1}
          onChange={(v) => set("type1", v)}
          required
          error={errors[`${role}.type1`]}
        />
        <TypeSelect
          label="Tipo 2"
          value={state.type2}
          onChange={(v) => set("type2", v)}
          allowNone
          error={errors[`${role}.type2`]}
        />
      </div>
      <div className="field-row">
        <StatField
          label="ATK"
          value={state.atk}
          onChange={(v) => set("atk", v)}
          required={isAttacking}
          error={isAttacking ? errors["attacker.atk"] : undefined}
        />
        <StatField
          label="Sp. ATK"
          value={state.spAtk}
          onChange={(v) => set("spAtk", v)}
          required={isAttacking}
          error={isAttacking ? errors["attacker.spAtk"] : undefined}
        />
      </div>
      <div className="field-row">
        <StatField
          label="DEF"
          value={state.def}
          onChange={(v) => set("def", v)}
          required={!isAttacking}
          error={!isAttacking ? errors["defender.def"] : undefined}
        />
        <StatField
          label="Sp. DEF"
          value={state.spDef}
          onChange={(v) => set("spDef", v)}
          required={!isAttacking}
          error={!isAttacking ? errors["defender.spDef"] : undefined}
        />
      </div>
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
      >
        ⚙ Configurações avançadas {showAdvanced ? "▲" : "▼"}
      </button>
      {showAdvanced && (
        <>
          <div className="field-row field-row-muted">
            <StatField
              label="Modificação ATK"
              value={state.modAtk}
              onChange={(v) => set("modAtk", v)}
              placeholder="0"
            />
            <StatField
              label="Modificação Sp. ATK"
              value={state.modSpAtk}
              onChange={(v) => set("modSpAtk", v)}
              placeholder="0"
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
        </>
      )}
    </Panel>
  );
}
