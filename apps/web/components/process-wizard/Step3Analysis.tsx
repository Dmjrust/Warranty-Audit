'use client';

import { useState } from 'react';

interface Props {
  token: string;
  processId: string;
  initialData?: any;
  onSaved: (result: any) => void;
}

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
    try {
      const { processApi } = await import('@/lib/process-api');
      const result = await processApi.saveAnalysis(token, processId, { ...form, imageUrls });
      onSaved(result);
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
        {saving ? 'Salvando análise...' : 'Salvar e continuar →'}
      </button>
    </form>
  );
}
