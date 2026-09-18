/**
 * Filtro client-side sobre uma lista já carregada em memória — não bate
 * na API por tecla digitada. Usado pelo modo Catálogo dos painéis de
 * Pokémon (Etapa 3) e reaproveitado pela busca de golpe (Etapa 4).
 *
 * Casa por substring no rótulo principal, no rótulo secundário (ex.:
 * "#25"), ou por igualdade exata com o id (ex.: digitar "25" acha o
 * pokémon de pokeapi_id 25 mesmo que o nome não contenha "25").
 */
export function filterCatalogItems<T>(
  items: T[],
  query: string,
  getId: (item: T) => number,
  getLabel: (item: T) => string,
  getSubLabel?: (item: T) => string,
  limit = 8
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit);

  return items
    .filter((item) => {
      const label = getLabel(item).toLowerCase();
      const sub = getSubLabel?.(item)?.toLowerCase() ?? "";
      return label.includes(q) || sub.includes(q) || String(getId(item)) === q;
    })
    .slice(0, limit);
}
