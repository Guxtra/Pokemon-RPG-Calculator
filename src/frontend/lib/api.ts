/**
 * api.ts — cliente HTTP pro backend FastAPI (integração da V3).
 *
 * Camada isolada: só chama a API e tipa as respostas. Não contém
 * regra de negócio nem lógica de UI — isso fica pros componentes que
 * forem usar essas funções nos próximos passos da integração.
 *
 * Nota sobre convenção de nomes (decisão do projeto): GET /api/pokemon
 * e GET /api/moves respondem em snake_case; GET /api/pokemon/{id}/stats
 * e POST /api/damage/calculate respondem em camelCase. Essa
 * inconsistência é conhecida e foi mantida de propósito — os tipos
 * abaixo refletem exatamente o que cada endpoint devolve.
 */
import type { DamageInput, DamageResult } from "../../core/models";

function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error(
      "VITE_API_URL não está definida. Copie .env.example para .env e configure a URL da API."
    );
  }
  return url;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Erro de chamada à API — inclui o status HTTP e, quando o backend manda, a lista {field, message}. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: ApiFieldError[];

  constructor(message: string, status: number, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function throwApiError(response: Response): Promise<never> {
  let errors: ApiFieldError[] | undefined;
  try {
    const body = await response.json();
    errors = body?.errors;
  } catch {
    // Corpo não era JSON (ou veio vazio) — segue sem detalhe estruturado.
  }
  throw new ApiError(`Erro ${response.status} ao chamar ${response.url}`, response.status, errors);
}

/** Item de GET /api/pokemon. Campos em snake_case (ver nota no topo do arquivo). */
export interface PokemonListItem {
  pokeapi_id: number;
  name: string;
  national_dex_number: number;
  type1: string;
  type2: string | null;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_sp_atk: number;
  base_sp_def: number;
  base_speed: number;
}

export async function getPokemonList(): Promise<PokemonListItem[]> {
  const response = await fetch(`${getApiUrl()}/api/pokemon`);
  if (!response.ok) return throwApiError(response);
  return response.json();
}

/** Resposta de GET /api/pokemon/{id}/stats. Campos em camelCase. */
export interface PokemonStats {
  pokeapiId: number;
  name: string;
  level: number;
  type1: string;
  type2: string | null;
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export async function getPokemonStats(pokeapiId: number, level: number): Promise<PokemonStats> {
  const url = `${getApiUrl()}/api/pokemon/${pokeapiId}/stats?level=${level}`;
  const response = await fetch(url);
  if (!response.ok) return throwApiError(response);
  return response.json();
}

/** Item de GET /api/moves. Campos em snake_case (ver nota no topo do arquivo). */
export interface MoveListItem {
  pokeapi_id: number;
  name: string;
  type: string;
  power: number;
  category: "PHYSICAL" | "SPECIAL";
}

export async function getMoves(): Promise<MoveListItem[]> {
  const response = await fetch(`${getApiUrl()}/api/moves`);
  if (!response.ok) return throwApiError(response);
  return response.json();
}

/**
 * POST /api/damage/calculate. Reaproveita DamageInput/DamageResult de
 * core/models.ts — já são exatamente o contrato JSON camelCase da API,
 * sem precisar de nenhum tipo próprio aqui.
 */
export async function calculateDamageViaApi(input: DamageInput): Promise<DamageResult> {
  const response = await fetch(`${getApiUrl()}/api/damage/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return throwApiError(response);
  return response.json();
}
