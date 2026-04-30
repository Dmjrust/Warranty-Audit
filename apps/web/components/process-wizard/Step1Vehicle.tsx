'use client';

import { useState } from 'react';

interface Props {
  token: string;
  processId: string;
  policyVersionId: string;
  initialData?: any;
  onSaved: (result: any) => void;
}

export function Step1Vehicle({ token, processId, policyVersionId, initialData, onSaved }: Props) {
  const [form, setForm] = useState({
    vin: initialData?.vin ?? '',
    modelo: initialData?.modelo ?? '',
    hodometro: initialData?.hodometro ?? '',
    anoFabricacao: initialData?.anoFabricacao ?? '',
    sistemaAfetado: initialData?.sistemaAfetado ?? '',
    codigoFalha: initialData?.codigoFalha ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const sistemas = ['Motor', 'Transmissão', 'Suspensão', 'Freios', 'Eixo', 'Elétrico', 'Outro'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      const { processApi } = await import('@/lib/process-api');
      const result = await processApi.saveVehicle(token, processId, {
        ...form,
        hodometro: Number(form.hodometro),
      });
      if (!result.eligibility.eligible) {
        setErrors(result.eligibility.violations.map((v: any) => v.message));
      } else {
        onSaved(result);
      }
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">VIN (Chassi)</label>
          <input
            className="input font-mono uppercase"
            value={form.vin}
            onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
            placeholder="9BM384075MB123456"
            maxLength={17}
            required
          />
          <p className="text-xs text-gray-500 mt-1">17 caracteres alfanuméricos</p>
        </div>

        <div>
          <label className="label">Modelo</label>
          <input
            className="input"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            placeholder="ex: FH 460"
            required
          />
        </div>

        <div>
          <label className="label">Ano de Fabricação</label>
          <input
            className="input"
            value={form.anoFabricacao}
            onChange={(e) => setForm({ ...form, anoFabricacao: e.target.value })}
            placeholder="2022"
            maxLength={4}
          />
        </div>

        <div>
          <label className="label">Hodômetro (km)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.hodometro}
            onChange={(e) => setForm({ ...form, hodometro: e.target.value })}
            placeholder="150000"
            required
          />
        </div>

        <div>
          <label className="label">Sistema Afetado</label>
          <select
            className="input"
            value={form.sistemaAfetado}
            onChange={(e) => setForm({ ...form, sistemaAfetado: e.target.value })}
            required
          >
            <option value="">Selecione...</option>
            {sistemas.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Código de Falha (DTC)</label>
          <input
            className="input"
            value={form.codigoFalha}
            onChange={(e) => setForm({ ...form, codigoFalha: e.target.value })}
            placeholder="P0123, SPN 110..."
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-red-400">Veículo não elegível:</p>
          {errors.map((e, i) => <p key={i} className="text-sm text-red-300">• {e}</p>)}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Validando elegibilidade...' : 'Salvar e continuar →'}
      </button>
    </form>
  );
}
