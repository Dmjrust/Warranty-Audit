import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import type { ProcessSummary } from '@/lib/process-api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StepLabel({ step }: { step: string }) {
  const map: Record<string, string> = {
    VEHICLE:   'Passo 1 — Veículo',
    CHECKLIST: 'Passo 2 — Checklist',
    ANALYSIS:  'Passo 3 — Análise',
    VERDICT:   'Passo 4 — Veredito',
  };
  return <span className="text-xs text-gray-500">{map[step] ?? step}</span>;
}

export default async function ProcessesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = session.user as any;
  const token: string = user.accessToken;

  const API = process.env.API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${API}/api/processes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const processes: ProcessSummary[] = res.ok ? await res.json() : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Processos de Auditoria</h2>
          <p className="text-sm text-gray-400 mt-0.5">{processes.length} processo(s) encontrado(s)</p>
        </div>
        <Link
          href="/processes/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Processo
        </Link>
      </div>

      {processes.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum processo encontrado.</p>
          <p className="text-gray-600 text-sm mt-1">Clique em "Novo Processo" para começar.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Montadora</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">VIN</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">SLA</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Score</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                    {p.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {p.policyVersion?.manufacturer?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                    {p.vehicleData?.vin ?? (
                      <span className="text-gray-600 italic">não informado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge status={p.status} />
                      <StepLabel step={p.currentStep} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={p.slaStatus} />
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {p.latestScore?.scoreFinal != null
                      ? p.latestScore.scoreFinal
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/processes/${p.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
