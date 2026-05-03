'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Step1Vehicle } from './Step1Vehicle';
import { Step2Checklist } from './Step2Checklist';
import { Step3Analysis } from './Step3Analysis';
import { Step4Verdict } from './Step4Verdict';

const STEPS = [
  { id: 'VEHICLE',   label: 'Veículo',          number: 1 },
  { id: 'CHECKLIST', label: 'Checklist',         number: 2 },
  { id: 'ANALYSIS',  label: 'Análise Técnica',   number: 3 },
  { id: 'VERDICT',   label: 'Veredito',          number: 4 },
];

interface Props {
  token: string;
  processId: string;
  policyVersionId: string;
  initialStep?: string;
  initialData?: {
    vehicleData?: any;
    checklistData?: any;
    analysisData?: any;
  };
}

export function ProcessWizard({
  token, processId, policyVersionId, initialStep = 'VEHICLE', initialData = {},
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [sdScore, setSdScore] = useState<number>(0);
  const [stScore, setStScore] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  function handleStep1Saved() {
    setCurrentStep('CHECKLIST');
  }

  function handleStep2Saved(result: any) {
    setSdScore(result.scoreSd ?? 0);
    setCurrentStep('ANALYSIS');
  }

  function handleStep3Saved(result: any) {
    if (result?.aiResult?.scoreTecnico != null) {
      setStScore(result.aiResult.scoreTecnico);
    }
    setCurrentStep('VERDICT');
  }

  function handleStep4Saved() {
    setDone(true);
    setTimeout(() => router.push('/processes'), 1800);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-white">Processo concluído!</h2>
        <p className="text-gray-400 mt-2">Redirecionando para a lista de processos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, i) => {
          const isCompleted = i < stepIndex;
          const isCurrent = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted ? 'bg-emerald-600 text-white' :
                  isCurrent   ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-950' :
                                'bg-gray-800 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : step.number}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-800'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">
          {STEPS[stepIndex]?.label}
        </h2>

        {currentStep === 'VEHICLE' && (
          <Step1Vehicle
            token={token}
            processId={processId}
            policyVersionId={policyVersionId}
            initialData={initialData.vehicleData}
            onSaved={handleStep1Saved}
          />
        )}

        {currentStep === 'CHECKLIST' && (
          <Step2Checklist
            token={token}
            processId={processId}
            policyVersionId={policyVersionId}
            onSaved={handleStep2Saved}
          />
        )}

        {currentStep === 'ANALYSIS' && (
          <Step3Analysis
            token={token}
            processId={processId}
            initialData={initialData.analysisData}
            onSaved={handleStep3Saved}
          />
        )}

        {currentStep === 'VERDICT' && (
          <Step4Verdict
            token={token}
            processId={processId}
            sdScore={sdScore}
            stScore={stScore}
            onSaved={handleStep4Saved}
          />
        )}
      </div>
    </div>
  );
}
