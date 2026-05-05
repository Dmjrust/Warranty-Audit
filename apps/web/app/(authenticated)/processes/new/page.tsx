import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProcessWizard } from '@/components/process-wizard/ProcessWizard';

export default async function NewProcessPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = session.user as any;
  const token: string = user.accessToken;
  const tenantId: string = user.tenantId;

  if (!tenantId) {
    return (
      <div className="p-6 text-center text-yellow-400">
        Seu usuário não está vinculado a um tenant. Contate o administrador.
      </div>
    );
  }

  // Create the process server-side before rendering the wizard
  const API: string = process.env.API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${API}/api/processes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div className="p-6 text-center text-red-400">
        Erro ao criar processo: {err.message ?? res.statusText}
      </div>
    );
  }

  const newProcess = await res.json();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Novo Processo de Auditoria</h2>
          <p className="text-xs text-gray-500 mt-0.5">#{newProcess.id.slice(0, 8)}</p>
        </div>
        <a href="/processes" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </a>
      </div>

      <ProcessWizard
        token={token}
        processId={newProcess.id}
        policyVersionId={newProcess.policyVersion?.id}
        initialStep="VEHICLE"
      />
    </div>
  );
}
