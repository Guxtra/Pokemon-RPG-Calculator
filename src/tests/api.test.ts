import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DamageInput } from "../core/models";
import {
  ApiError,
  calculateDamageViaApi,
  getMoves,
  getPokemonList,
  getPokemonStats,
} from "../frontend/lib/api";

function mockFetchResponse(status: number, body: unknown, url = "http://localhost:8000/api/x") {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    json: async () => body,
  } as Response;
}

describe("api.ts", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://localhost:8000");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("getPokemonList chama a URL certa e devolve os itens", async () => {
    const items = [{ pokeapi_id: 25, name: "pikachu", national_dex_number: 25 }];
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, items));

    const result = await getPokemonList();

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/pokemon");
    expect(result).toEqual(items);
  });

  it("getPokemonStats monta a URL com pokeapiId e level", async () => {
    const stats = { pokeapiId: 25, name: "pikachu", level: 50, atk: 75 };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, stats));

    const result = await getPokemonStats(25, 50);

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/pokemon/25/stats?level=50");
    expect(result).toEqual(stats);
  });

  it("getMoves chama a URL certa e devolve os itens", async () => {
    const items = [{ pokeapi_id: 85, name: "thunderbolt", type: "electric" }];
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, items));

    const result = await getMoves();

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/moves");
    expect(result).toEqual(items);
  });

  it("calculateDamageViaApi envia POST com JSON e devolve o resultado", async () => {
    const input: DamageInput = {
      attacker: { type1: "fire", atk: 100, spAtk: 80, statModifiers: { atk: 0, spAtk: 0 } },
      move: { type: "fire", category: "PHYSICAL", power: 90 },
      defender: { type1: "water", def: 70, spDef: 60, statModifiers: { def: 0, spDef: 0 } },
      modifiers: { critical: false },
    };
    const damageResult = { isDamagingMove: true, finalDamage: 10 };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, damageResult));

    const result = await calculateDamageViaApi(input);

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/damage/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(result).toEqual(damageResult);
  });

  it("lança ApiError com status e errors quando a API responde com erro estruturado", async () => {
    const errorBody = { errors: [{ field: "level", message: "Nível inválido." }] };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(422, errorBody));

    await expect(getPokemonStats(25, 0)).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      errors: errorBody.errors,
    });
  });

  it("lança ApiError mesmo quando o corpo do erro não é JSON válido", async () => {
    const response = {
      ok: false,
      status: 500,
      url: "http://localhost:8000/api/pokemon",
      json: async () => {
        throw new Error("corpo vazio");
      },
    } as unknown as Response;
    vi.mocked(fetch).mockResolvedValueOnce(response);

    await expect(getPokemonList()).rejects.toBeInstanceOf(ApiError);
  });

  it("lança um erro claro quando VITE_API_URL não está configurada", async () => {
    vi.stubEnv("VITE_API_URL", "");

    await expect(getPokemonList()).rejects.toThrow(/VITE_API_URL/);
  });
});
