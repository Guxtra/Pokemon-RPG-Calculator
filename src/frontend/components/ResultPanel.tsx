import { useState } from "react";
import type { DamageResult } from "../../core/models";
import { formatResultAsText } from "../../core/formatResult";
import { TYPE_LABELS } from "../../data/types";

interface ResultPanelProps {
  result: DamageResult;
  attackerName?: string;
  moveName?: string;
  defenderName?: string;
  moveEffect?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function ResultPanel({
  result,
  attackerName,
  moveName,
  defenderName,
  moveEffect,
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const attacker = attackerName?.trim() || "O atacante";
  const move = moveName?.trim() || "o golpe";
  const defender = defenderName?.trim();

  const handleCopy = async () => {
    const text = formatResultAsText(result, { attackerName, moveName, defenderName });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard indisponível (ex.: permissão negada); ignora silenciosamente.
    }
  };

  const attackChanged = result.attackDetail.modification !== 0;
  const defenseChanged = result.defenseDetail.modification !== 0;

  return (
    <section className="result-panel">
      <div className="result-perforation" aria-hidden />
      <div className="result-body">
        <p className="result-headline">
          {defender ? `${attacker} usou ${move} em ${defender}!` : `${attacker} usou ${move}!`}
        </p>

        {(attackChanged || defenseChanged) && (
          <div className="result-stat-changes">
            {attackChanged && (
              <p className="result-stat-line">
                ATK relevante: {result.attackDetail.original} → modificação{" "}
                {result.attackDetail.modification > 0 ? "+" : ""}
                {result.attackDetail.modification} → efetivo{" "}
                <strong>{result.attackDetail.effective}</strong>
              </p>
            )}
            {defenseChanged && (
              <p className="result-stat-line">
                DEF relevante: {result.defenseDetail.original} → modificação{" "}
                {result.defenseDetail.modification > 0 ? "+" : ""}
                {result.defenseDetail.modification} → efetiva{" "}
                <strong>{result.defenseDetail.effective}</strong>
                {result.defenseDetail.modified < result.defenseDetail.effective && (
                  <span className="result-floor-note"> (piso mínimo 1 aplicado)</span>
                )}
              </p>
            )}
          </div>
        )}

        {!result.isDamagingMove ? (
          <>
            <p className="result-no-damage">Este movimento não causa dano direto.</p>
            {moveEffect?.trim() && (
              <p className="result-stat-line">Efeito: {moveEffect.trim()}</p>
            )}
          </>
        ) : (
          <>
            <div className="result-rows">
              <div className="result-row">
                <span className="result-row-index">1</span>
                <span className="result-row-label">Dano Base</span>
                <span className="result-row-value">{round2(result.baseDamage)}</span>
              </div>
              <div className="result-row">
                <span className="result-row-index">2</span>
                <span className="result-row-label">STAB</span>
                <span className="result-row-value">×{result.stabMultiplier}</span>
              </div>
              <div className="result-row">
                <span className="result-row-index">3</span>
                <span className="result-row-label">Efetividade</span>
                <span className="result-row-value">×{round2(result.effectivenessMultiplier)}</span>
              </div>
              {result.effectivenessBreakdown.length > 1 && (
                <div className="result-row-sub">
                  {result.effectivenessBreakdown.map((entry) => (
                    <span key={entry.defenseType}>
                      {TYPE_LABELS[entry.defenseType]} ×{entry.multiplier}
                    </span>
                  ))}
                </div>
              )}
              <div className="result-row">
                <span className="result-row-index">4</span>
                <span className="result-row-label">Crítico</span>
                <span className="result-row-value">×{result.criticalMultiplier}</span>
              </div>
              <div className="result-row">
                <span className="result-row-index">5</span>
                <span className="result-row-label">Modificador</span>
                <span className="result-row-value">×{result.otherMultiplier}</span>
              </div>
            </div>

            <div className="result-final">
              <span className="result-final-label">Dano Final</span>
              <span className="result-final-value">{result.finalDamage}</span>
            </div>
          </>
        )}

        <button type="button" className="copy-button" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar resultado"}
        </button>
      </div>
    </section>
  );
}
