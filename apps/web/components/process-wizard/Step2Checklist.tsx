'use client';

import { useState, useEffect } from 'react';
import { ChecklistItem } from '@/lib/process-api';

interface Props {
  token: string;
  processId: string;
  policyVersionId: string;
  onSaved: (result: any) => void;
}

export function Step2Checklist({ token, processId, policyVersionId, onSaved }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloqueantes, setBloqueantes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { processApi } = await import('@/lib/process-api');
        const data = await processApi.getChecklist(token, policyVersionId);
        setItems(data.items);
        const init: Record<string, boolean | null> = {};
        data.items.forEach((i) => { init[i.id] = null; });
        setAnswers(init);
      } finally {
        setLoading(false);
      }
    })();
  }, [policyVersionId, token]);

  const allAnswered = items.length > 0 && items.every((i) => answers[i.id] !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { processApi } = await import('@/lib/process-api');
      const formatted = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: answer as boolean,
      }));
      const result = await processApi.saveChecklist(token, processId, formatted);
      setBloqueantes(result.bloqueantes ?? []);
      if ((result.bloqueantes ?? []).length === 0) {
        onSaved(result);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500 animate-pulse">Carregando checklist...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border p-4 transition-colors ${
            bloqueantes.includes(item.id)
              ? 'border-red-700 bg-red-950/30'
              : answers[item.id] === null
              ? 'border-gray-700 bg-gray-900/50'
              : answers[item.id]
              ? 'border-emerald-800 bg-emerald-950/20'
              : item.bloqueante
              ? 'border-red-700 bg-red-950/30'
              : 'border-yellow-800 bg-yellow-950/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-white">
                {item.bloqueante && (
                  <span className="text-red-400 text-xs font-medium mr-1">[BLOQUEANTE]</span>
                )}
                {item.pergunta}
              </p>
              {item.orientacao && (
                <p className="text-xs text-gray-400 mt-1">{item.orientacao}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">+{item.impacto_sd} pts</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, [item.id]: true })}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  answers[item.id] === true
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, [item.id]: false })}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  answers[item.id] === false
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      ))}

      {bloqueantes.length > 0 && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
          <p className="text-sm font-medium text-red-400">Processo bloqueado</p>
          <p className="text-sm text-red-300 mt-1">
            {bloqueantes.length} critério(s) bloqueante(s) não atendido(s).
            O processo não pode avançar para submissão.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !allAnswered}
        className="btn-primary w-full disabled:opacity-40"
      >
        {saving ? 'Salvando...' : !allAnswered ? 'Responda todas as perguntas' : 'Salvar e continuar →'}
      </button>
    </form>
  );
}
