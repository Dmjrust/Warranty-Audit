import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

const STATUS_LABEL: Record<string, string> = {
  DRAFT:              'Rascunho',
  CHECKLIST_PENDING:  'Checklist',
  ANALYSIS_PENDING:   'Análise',
  PENDING_APPROVAL:   'Aguardando',
  APPROVED:           'Aprovado',
  REJECTED:           'Rejeitado',
  SUBMITTED:          'Submetido',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:              'bg-gray-700',
  CHECKLIST_PENDING:  'bg-blue-700',
  ANALYSIS_PENDING:   'bg-purple-700',
  PENDING_APPROVAL:   'bg-yellow-700',
  APPROVED:           'bg-emerald-700',
  SUBMITTED:          'bg-emerald-800',
  REJECTED:           'bg-red-700',
};

const SLA_DOT: Record<string, string> = {
  green:  'bg-emerald-400',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
  red:    'bg-red-400',
};

function KpiCard({
  label, value, sub, highlight,
}: { label: string; value: string | number; sub?: string; highlight?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${highlight ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = session.user as any;
  const token: string = user.accessToken;

  const API = process.env.API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${API}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = res.ok ? await res.json() : null;
  const kpis = data?.kpis;
  const breakdown: Record<string, number> = data?.statusBreakdown ?? {};
  const tendencia: { mes: string; aprovados: number; total: number }[] = data?.tendenciaMensal ?? [];
  const recentes = data?.processosRecentes ?? [];

  const totalProcessos = Object.values(breakdown).reduce((a: number, b) => a + (b as number), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Bem-vindo, {session.user?.name || session.user?.email}
          </p>
        </div>
        <Link
          href="/processes/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Processo
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Processos em aberto"
          value={kpis?.totalAbertos ?? '—'}
          sub="aguardando ação"
        />
        <KpiCard
          label="Score médio (30 dias)"
          value={kpis?.scoreMedio != null ? kpis.scoreMedio : '—'}
          sub="score composto SD+ST+SH"
          highlight={
            kpis?.scoreMedio >= 85 ? 'text-emerald-400' :
            kpis?.scoreMedio >= 60 ? 'text-yellow-400' :
            kpis?.scoreMedio != null ? 'text-red-400' : 'text-white'
          }
        />
        <KpiCard
          label="Taxa de aprovação (30 dias)"
          value={kpis?.taxaAprovacao != null ? `${kpis.taxaAprovacao}%` : '—'}
          sub="aprovados / encerrados"
          highlight={
            kpis?.taxaAprovacao >= 80 ? 'text-emerald-400' :
            kpis?.taxaAprovacao >= 60 ? 'text-yellow-400' :
            kpis?.taxaAprovacao != null ? 'text-red-400' : 'text-white'
          }
        />
        <KpiCard
          label="SLA em risco"
          value={kpis?.slaEmRisco ?? '—'}
          sub="laranja ou vermelho"
          highlight={kpis?.slaEmRisco > 0 ? 'text-orange-400' : 'text-white'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuição por Status</h3>
          {totalProcessos === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Nenhum processo</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(breakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([status, count]) => {
                  const pct = Math.round(((count as number) / totalProcessos) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{STATUS_LABEL[status] ?? status}</span>
                        <span className="text-gray-500">{count as number} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLOR[status] ?? 'bg-gray-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Taxa de Aprovação — últimos 6 meses</h3>
          {tendencia.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Dados insuficientes — finalize processos para ver a tendência.
            </p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {tendencia.map((t) => {
                const pct = t.total > 0 ? Math.round((t.aprovados / t.total) * 100) : 0;
                const [, mm] = t.mes.split('-');
                const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                const label = monthNames[parseInt(mm, 10) - 1] ?? mm;
                return (
                  <div key={t.mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{pct}%</span>
                    <div className="w-full bg-gray-800 rounded-t relative" style={{ height: '80px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${
                          pct >= 80 ? 'bg-emerald-600' : pct >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent processes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Processos Recentes</h3>
          <Link href="/processes" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Ver todos →
          </Link>
        </div>
        {recentes.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">
            Nenhum processo ainda.{' '}
            <Link href="/processes/new" className="text-blue-400 hover:underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">ID</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Montadora</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Status</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">SLA</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Score</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {recentes.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-gray-300 text-xs">{p.manufacturer ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLOR[p.status] ?? 'bg-gray-700'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${SLA_DOT[p.slaStatus] ?? 'bg-gray-600'}`} />
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-white text-sm">
                    {p.scoreFinal ?? <span className="text-gray-600 font-normal">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/processes/${p.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
