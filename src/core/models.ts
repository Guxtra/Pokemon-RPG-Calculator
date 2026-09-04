/**
 * Modelos de domínio do motor de cálculo.
 *
 * Estes tipos são puramente conceituais: não dependem de HTML, React,
 * banco de dados ou qualquer componente visual. O motor funciona
 * exclusivamente com estes objetos (ou com JSON equivalente), podendo
 * ser reutilizado por uma futura API, bot de Discord, app mobile etc.
 *
 * Nota de evolução futura: a V1 recebe instâncias "já prontas" (objetos
 * simples). Em versões futuras, esses objetos poderão ser produzidos por
 * repositórios (PokemonRepository, MoveRepository, ItemRepository,
 * AbilityRepository, CampaignRepository) sem alterar o motor. O modelo
 * também já está pronto para uma futura distinção entre Pokémon Species
 * (dados de espécie) e Pokémon Instance (uma instância pertencente a um
 * jogador, com nível, moves, item, habilidade etc.).
 */

/** Os 18 tipos modernos do RPG (dados vêm de data/types.ts). */
export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/** Categoria do golpe: determina quais atributos entram na divisão. */
export type MoveCategory = "PHYSICAL" | "SPECIAL";

/** Modificações ABSOLUTAS de atributos (soma/subtração, não estágios oficiais). */
export interface StatModifiers {
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
}

/** Atacante. */
export interface Attacker {
  /** Nome informativo (não entra no cálculo). Ex.: "Charmander". */
  name?: string;
  type1: PokemonType;
  /** Opcional — ausente/vazio = atacante de tipo único. */
  type2?: PokemonType;
  atk: number;
  spAtk: number;
  statModifiers?: Partial<StatModifiers>;
}

/** Efeito de um movimento (V1: estrutura mínima, sem resolução automática). */
export interface MoveEffect {
  /** Descrição livre para exibição na interface (ex.: "DEF do alvo -2"). */
  description: string;
}

/** Golpe / movimento. */
export interface Move {
  /** Nome informativo (não entra no cálculo). Ex.: "Ember". */
  name?: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  /**
   * Efeitos do movimento (ex.: Tail Whip → "DEF do alvo -2").
   * Na V1 os efeitos são apenas transportados e exibidos, sem
   * processamento automático — um futuro EffectResolver poderá
   * consumir isso e aplicar automaticamente.
   */
  effects?: MoveEffect[];
}

/** Defensor. */
export interface Defender {
  name?: string;
  type1: PokemonType;
  type2?: PokemonType;
  def: number;
  spDef: number;
  statModifiers?: Partial<StatModifiers>;
}

/** Modificadores manuais aplicados por último. */
export interface BattleModifiers {
  /** Crítico marcado → ×1.5; desmarcado → ×1. */
  critical: boolean;
  /** Campo "Modificador": multiplicação manual final. Ausente equivale a 1. */
  multiplier?: number;
}

/** Tudo o que o motor precisa para calcular um golpe. */
export interface DamageInput {
  attacker: Attacker;
  move: Move;
  defender: Defender;
  modifiers: BattleModifiers;
}

/** Atributos de uma criatura após aplicar as modificações absolutas. */
export interface EffectiveStats {
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
}

/** Detalhamento de um atributo efetivo, para auditoria na interface. */
export interface EffectiveStatDetail {
  original: number;
  modification: number;
  modified: number;
  /** Valor realmente usado no cálculo (defesa nunca cai abaixo de 1). */
  effective: number;
}

/** Detalhamento da efetividade de tipo, tipo a tipo. */
export interface EffectivenessBreakdownEntry {
  defenseType: PokemonType;
  multiplier: number;
}

/**
 * Resultado estruturado retornado pelo motor.
 * A interface (ou qualquer consumidor futuro) apenas APRESENTA este objeto.
 */
export interface DamageResult {
  isDamagingMove: boolean;

  baseDamage: number;
  effectiveAttack: number;
  effectiveDefense: number;

  stabMultiplier: number;
  effectivenessMultiplier: number;
  criticalMultiplier: number;
  otherMultiplier: number;

  /** Dano final já arredondado (política: round-half-up) e nunca < 0. */
  finalDamage: number;

  /** Atributos efetivos (após modificações absolutas), para auditoria/exibição. */
  effectiveStats: EffectiveStats;

  /** Detalhe de ATK e DEF relevantes: original → modificação → efetivo. */
  attackDetail: EffectiveStatDetail;
  defenseDetail: EffectiveStatDetail;

  /** Detalhamento da efetividade por tipo do defensor. */
  effectivenessBreakdown: EffectivenessBreakdownEntry[];
}
