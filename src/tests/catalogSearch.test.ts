import { describe, expect, it } from "vitest";
import { filterCatalogItems } from "../frontend/lib/catalogSearch";

interface FakePokemon {
  id: number;
  name: string;
  dex: number;
}

const items: FakePokemon[] = [
  { id: 1, name: "bulbasaur", dex: 1 },
  { id: 4, name: "charmander", dex: 4 },
  { id: 7, name: "squirtle", dex: 7 },
  { id: 25, name: "pikachu", dex: 25 },
  { id: 26, name: "raichu", dex: 26 },
];

const getId = (p: FakePokemon) => p.id;
const getLabel = (p: FakePokemon) => p.name;
const getSubLabel = (p: FakePokemon) => `#${p.dex}`;

describe("filterCatalogItems", () => {
  it("sem busca, devolve os primeiros itens até o limite", () => {
    const result = filterCatalogItems(items, "", getId, getLabel, getSubLabel, 3);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("bulbasaur");
  });

  it("filtra por substring no nome (case-insensitive)", () => {
    const result = filterCatalogItems(items, "CHAR", getId, getLabel, getSubLabel);
    expect(result).toEqual([items[1]]);
  });

  it("casa parcialmente por substring — 'chu' acha pikachu E raichu", () => {
    const result = filterCatalogItems(items, "chu", getId, getLabel, getSubLabel);
    expect(result.map((p) => p.name)).toEqual(["pikachu", "raichu"]);
  });

  it("filtra pelo rótulo secundário (ex.: '#25')", () => {
    const result = filterCatalogItems(items, "#25", getId, getLabel, getSubLabel);
    expect(result).toEqual([items[3]]);
  });

  it("acha por id exato mesmo sem getSubLabel", () => {
    const result = filterCatalogItems(items, "26", getId, getLabel);
    expect(result).toEqual([items[4]]);
  });

  it("respeita o limite de resultados", () => {
    const result = filterCatalogItems(items, "a", getId, getLabel, getSubLabel, 2);
    expect(result).toHaveLength(2);
  });

  it("sem match, devolve lista vazia", () => {
    const result = filterCatalogItems(items, "mewtwo", getId, getLabel, getSubLabel);
    expect(result).toEqual([]);
  });
});
