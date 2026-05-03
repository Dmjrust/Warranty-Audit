'use client';

import { useState, useEffect } from 'react';

interface Props {
  token: string;
  processId: string;
  sdScore: number;
  stScore?: number | null;
  onSaved: (result: any) => void;
}

const DECISION_MAP: Record<string, { label: string; color: string; icon: string }> = {
  aprovado:     { label: 'Aprovado para submissão', color: 'text-emerald-400', icon: '✅' },
  revisao:      { label: 'Revisão do gestor necessária', color: 'text-yellow-400', icon: '⚠️' },
  alto_risco:   { label: 'Alto risco de glosa', color: 'text-orange-400', icon: '🔶' },
  nao_submeter: { label: 'Não submeter — corrija as pendências', color: 'text-red-400', icon: '❌' },
};

export function Step4Verdict({ token, processId, sdScore, stScore, onSaved }: Props) {
  const [scoreSh, setScoreSh] = useState<number | null>(null);
  const [loadingSh, setLoadingSh] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSh() {
      try {
        const { processApi } = await import('@/lib/process-api');
        const { scoreSh: sh } = await processApi.getHistoryScore(token);
        setScoreSh(sh);
      } catch {
        setScoreSh(65);
      } finally {
        setLoadingSh(false);
      }
    }
    fetchSh();
  }, [token]);

  async function handleCalculate() {
    setLoading(true);
    try {
      const { processApi } = await import('@/lib/process-api');
      const res = await processApi.saveVerdict(token, processId, {
        scoreSt: stScore ?? null,
        scoreSh: scoreSh ?? undefined,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFinalize() {
    if (result) onSaved(result);
  }

  const decision = result ? DECISION_MAP[result.decision?.decision] : null;
  const stDisplay = stScore != null ? stScore : result?.scoreSt ?? null;

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Score Determinístico (SD)</p>
          <p className="text-3xl font-bold text-white">{sdScore}</p>
          <p className="text-xs text-gray-500 mt-1">Calculado pelo checklist</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Score Técnico IA (ST)</p>
          {stDisplay != null ? (
            <>
              <p className={`text-3xl font-bold ${
                stDisplay >= 75 ? 'text-emerald-400' :
                stDisplay >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>{stDisplay}</p>
              <p className="text-xs text-gray-500 mt-1">Calculado pela IA</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-500">—</p>
              <p className="text-xs text-gray-500 mt-1">Sem análise IA</p>
            </>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">Score Histórico (SH)</p>
          {loadingSh ? (
            <p className="text-3xl font-bold text-gray-500">...</p>
          ) : (
            <>
              <input
                type="number"
                min={20}
                max={95}
                value={scoreSh ?? 65}
                onChange={(e) => setScoreSh(Number(e.target.value))}
                className="w-20 bg-gray-800 border border-gray-600 rounded text-center text-xl font-bold text-white py-1"
              />
              <p className="text-xs text-gray-500 mt-1">Baseado no histórico</p>
            </>
          )}
        </div>
      </div>

      {!result && (
        <button
          onClick={handleCalculate}
          disabled={loading || loadingSh}
          className="btn-primary w-full"
        >
          {loading ? 'Calculando score final...' : 'Calcular veredito'}
        </button>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Score Final Composto</p>
                <p className="text-5xl font-bold text-white mt-1">{result.scoreFinal}</p>
                <p className="text-xs text-gray-500 mt-1">
                  SD({result.scoreSd}) × 0.5
                  {result.scoreSt != null ? ` + ST(${result.scoreSt}) × 0.3` : ' (ST ausente — peso redistribuído)'}
                  {` + SH(${result.scoreSh}) × 0.2`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl">{decision?.icon}</p>
              </div>
            </div>

            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  result.scoreFinal >= 85 ? 'bg-emerald-500' :
                  result.scoreFinal >= 60 ? 'bg-yellow-500' :
                  result.scoreFinal >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.scoreFinal}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span className="text-red-600">40</span>
              <span className="text-yellow-600">60</span>
              <span className="text-emerald-600">85</span>
              <span>100</span>
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${
            result.decision?.decision === 'aprovado' ? 'border-emerald-800 bg-emerald-950/30' :
            result.decision?.decision === 'revisao' ? 'border-yellow-800 bg-yellow-950/30' :
            'border-red-800 bg-red-950/30'
          }`}>
            <p className={`font-semibold ${decision?.color}`}>
              {decision?.icon} {decision?.label}
            </p>
            <p className="text-sm text-gray-300 mt-2">{result.decision?.motivo}</p>
          </div>

          <button onClick={handleFinalize} className="btn-primary w-full">
            Concluir processo
          </button>
        </div>
      )}
    </div>
  );
}
