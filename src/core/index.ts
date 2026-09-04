/**
 * Barrel do motor de cálculo.
 *
 * Exporta tudo o que a interface (ou qualquer consumidor futuro: API,
 * bot de Discord, app mobile) precisa. Nenhum código de UI é importado
 * aqui — o motor pode ser usado em Node puro.
 */

export type * from "./models";
export * from "./damageCalculator";
export * from "./typeCalculator";
export * from "./modifierCalculator";
export * from "./validators";
export * from "./formatResult";
export { TYPE_IDS, TYPES, TYPE_LABELS } from "../data/types";
export { TYPE_CHART } from "../data/typeChart";
export type { Effectiveness, TypeChart } from "../data/typeChart";
export { TYPE_COLORS } from "../data/typeColors";
