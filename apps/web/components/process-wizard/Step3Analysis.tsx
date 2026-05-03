'use client';

import { useState } from 'react';

interface AiResult {
  scoreTecnico: number | null;
  consistencia: string | null;
  pontosFortes: string[];
  lacunas: string[];
  recomendacoes: string[];
  justificativaTecnica: string | null;
  nivelConfianca: string | null;
  error?: string;
}

interface Props {
  token: string;
  processId: string;
  initialData?: any;
  onSaved: (result: any) => void;
}

const CONSISTENCIA_MAP: Record<string, { label: string; color: string }> = {
  aprovado:     { label: 'Diagnóstico consistente', color: 'text-emerald-400' },
  inconsistente: { label: 'Diagnóstico inconsistente', color: 'text-orange-400' },
  insuficiente:  { label: 'Diagnóstico insuficiente', color: 'text-red-400' },
};

const CONFIANCA_MAP: Record<string, string> = {
  alto:  'text-emerald-400',
  medio: 'text-yellow-400',
  baixo: 'text-red-400',
};

export function Step3Analysis({ token, processId, initialData, onSaved }: Props) {
  const [form, setForm] = useState({
    sintomas: initialData?.sintomas ?? '',
    inspecaoInicial: initialData?.inspecaoInicial ?? '',
    causaRaiz: initialData?.causaRaiz ?? '',
    testesRealizados: initialData?.testesRealizados ?? '',
    historicoIntervencoes: initialData?.historicoIntervencoes ?? '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);

    if (selected.length > 0) {
      setUploading(true);
      try {
        const { processApi } = await import('@/lib/process-api');
        const urls = await processApi.uploadImages(token, processId, selected);
        setImageUrls((prev) => [...prev, ...urls]);
      } catch {
        setError('Falha no upload das imagens. Tente novamente.');
      } finally {
        setUploading(false);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setAiResult(null);
    try {
      const { processApi } = await import('@/lib/process-api');
      const result = await processApi.saveAnalysis(token, processId, { ...form, imageUrls });
      if (result.aiResult) {
        setAiResult(result.aiResult);
      } else {
        onSaved(result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const Field = ({
    label, field, rows = 3, placeholder,
  }: { label: string; field: keyof typeof form; rows?: number; placeholder?: string }) => (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input resize-none"
        rows={rows}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        required={['sintomas', 'inspecaoInicial', 'causaRaiz'].includes(field)}
      />
    </div>
  );

  if (aiResult) {
    const consistencia = aiResult.consistencia ? CONSISTENCIA_MAP[aiResult.consistencia] : null;
    const confiancaColor = aiResult.nivelConfianca ? CONFIANCA_MAP[aiResult.nivelConfianca] : 'text-gray-400';

    return (
      <div className="space-y-5">
        <div className="bg-blue-950/30 border border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Análise da IA — GPT-4o</h3>
            {aiResult.nivelConfianca && (
              <span className={`text-xs font-medium ${confiancaColor}`}>
                Confiança: {aiResult.nivelConfianca}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Score Técnico</p>
              <p className={`text-4xl font-bold ${
                (aiResult.scoreTecnico ?? 0) >= 75 ? 'text-emerald-400' :
                (aiResult.scoreTecnico ?? 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {aiResult.scoreTecnico ?? '—'}
              </p>
            </div>
            {consistencia && (
              <p className={`text-sm font-medium ${consistencia.color}`}>
                {consistencia.label}
              </p>
            )}
          </div>

          {aiResult.error && (
            <p className="text-xs text-yellow-400 mb-3">
              Análise automática indisponível: {aiResult.error}
            </p>
          )}

          {aiResult.pontosFortes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-emerald-500 font-medium mb-1">Pontos fortes</p>
              <ul className="space-y-0.5">
                {aiResult.pontosFortes.map((p, i) => (
                  <li key={i} className="text-xs text-gray-300">✓ {p}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResult.lacunas.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-orange-400 font-medium mb-1">Lacunas identificadas</p>
              <ul className="space-y-0.5">
                {aiResult.lacunas.map((l, i) => (
                  <li key={i} className="text-xs text-gray-300">⚠ {l}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResult.recomendacoes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-blue-400 font-medium mb-1">Recomendações</p>
              <ul className="space-y-0.5">
                {aiResult.recomendacoes.map((r, i) => (
                  <li key={i} className="text-xs text-gray-300">→ {r}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResult.justificativaTecnica && (
            <div className="mt-3 pt-3 border-t border-blue-800/50">
              <p className="text-xs text-gray-500 font-medium mb-1">Justificativa técnica gerada</p>
              <p className="text-xs text-gray-300 leading-relaxed">{aiResult.justificativaTecnica}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onSaved({ aiResult })}
          className="btn-primary w-full"
        >
          Continuar para o Veredito →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Sintomas relatados pelo operador"
        field="sintomas"
        placeholder="Descreva os sintomas exatamente como relatados..."
        rows={3}
      />
      <Field
        label="Resultado da inspeção inicial"
        field="inspecaoInicial"
        placeholder="O que foi observado durante a inspeção visual e física..."
        rows={3}
      />
      <Field
        label="Causa raiz identificada"
        field="causaRaiz"
        placeholder="Diagnóstico técnico fundamentado com base nos testes e inspeção..."
        rows={4}
      />
      <Field
        label="Testes realizados"
        field="testesRealizados"
        placeholder="Scanner, pressão, elétrico, mecânico... descreva os testes e resultados"
        rows={3}
      />
      <Field
        label="Histórico de intervenções anteriores"
        field="historicoIntervencoes"
        placeholder="Reparos anteriores relevantes, trocas de componentes, etc."
        rows={2}
      />

      {/* Image upload */}
      <div>
        <label className="label">Evidências fotográficas</label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="evidence-upload"
          />
          <label htmlFor="evidence-upload" className="cursor-pointer">
            <p className="text-sm text-gray-400">
              {uploading ? 'Enviando imagens...' : 'Clique para selecionar imagens de evidência'}
            </p>
            <p className="text-xs text-gray-600 mt-1">PNG, JPG, WEBP — máx. 10 arquivos</p>
          </label>
        </div>

        {imageUrls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="bg-gray-800 rounded px-2 py-1 text-xs text-gray-400 flex items-center gap-1">
                <span>📎</span>
                <span>{url.startsWith('local://') ? `Evidência ${i + 1}` : url.split('/').pop()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button type="submit" disabled={saving || uploading} className="btn-primary w-full">
        {saving ? 'Salvando e analisando com IA...' : 'Salvar e analisar →'}
      </button>
    </form>
  );
}
