import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">
          Bem-vindo, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Processos Abertos', value: '—' },
          { label: 'Valor em Auditoria', value: '—' },
          { label: 'Score Médio', value: '—' },
          { label: 'Taxa de Aprovação', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
        <p>Dados reais serão carregados após a Fase 2 e 3.</p>
      </div>
    </div>
  );
}
