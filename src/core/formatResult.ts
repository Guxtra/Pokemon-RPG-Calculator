import type { DamageResult } from "./models";

export interface FormatResultNames {
  attackerName?: string;
  moveName?: string;
  defenderName?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Formata o resultado do motor de cálculo como texto simples, pensado
 * para ser colado em Discord/WhatsApp.
 *
 * Não depende de React nem de nenhuma camada visual: pode ser
 * reaproveitado por uma futura API, bot de Discord etc. — por isso vive
 * no `core`, e não na camada de frontend.
 */
export function formatResultAsText(result: DamageResult, names: FormatResultNames = {}): string {
  const attacker = names.attackerName?.trim() || "O atacante";
  const move = names.moveName?.trim() || "o golpe";
  const defender = names.defenderName?.trim();

  const headline = defender
    ? `${attacker} usou ${move} em ${defender}!`
    : `${attacker} usou ${move}!`;

  const lines: string[] = [headline, ""];

  if (!result.isDamagingMove) {
    lines.push("Este movimento não causa dano direto.");
    return lines.join("\n");
  }

  lines.push(`Dano Base: ${round2(result.baseDamage)}`);
  lines.push("");
  lines.push(`STAB: ×${result.stabMultiplier}`);
  lines.push(`Efetividade: ×${round2(result.effectivenessMultiplier)}`);
  lines.push(`Crítico: ×${result.criticalMultiplier}`);
  lines.push(`Modificador: ×${result.otherMultiplier}`);
  lines.push("");
  lines.push(`Dano Final: ${result.finalDamage}`);

  return lines.join("\n");
}
