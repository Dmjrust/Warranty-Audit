import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProcessWizard } from '@/components/process-wizard/ProcessWizard';

interface Props { params: { id: string } }

export default async function EditProcessPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = session.user as any;
  const token: string = user.accessToken;

  const API: string = process.env.API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${API}/api/processes/${params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="p-6 text-red-400">Processo não encontrado.</div>;
  }

  const processData = await res.json();

  // Redirect completed processes to read-only summary
  const finalStatuses = ['APPROVED', 'REJECTED', 'SUBMITTED'];
  const isEditable = !finalStatuses.includes(processData.status);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {isEditable ? 'Continuar Processo' : 'Processo Concluído'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            #{processData.id.slice(0, 8)} — {processData.policyVersion?.manufacturer?.name}
          </p>
        </div>
        <a href="/processes" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </a>
      </div>

      {isEditable ? (
        <ProcessWizard
          token={token}
          processId={processData.id}
          policyVersionId={processData.policyVersion?.id}
          initialStep={processData.currentStep}
          initialData={{
            vehicleData: processData.vehicleData,
            checklistData: processData.checklistData,
            analysisData: processData.analysisData,
          }}
        />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {processData.decisionResult?.decision === 'aprovado' ? '✅' : '⚠️'}
            </span>
            <div>
              <p className="font-semibold text-white">
                {processData.decisionResult?.decision === 'aprovado'
                  ? 'Aprovado para submissão'
                  : 'Processo encerrado'}
              </p>
              <p className="text-sm text-gray-400">{processData.decisionResult?.motivo}</p>
            </div>
          </div>
          {processData.scoringResult && (
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-800">
              {[
                { label: 'Score Final', value: processData.scoringResult.final },
                { label: 'SD', value: processData.scoringResult.sd },
                { label: 'ST', value: processData.scoringResult.st ?? '—' },
                { label: 'SH', value: processData.scoringResult.sh },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
