'use client';

const variants: Record<string, string> = {
  green:  'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  orange: 'bg-orange-900/40 text-orange-400 border-orange-800',
  red:    'bg-red-900/40 text-red-400 border-red-800',
  blue:   'bg-blue-900/40 text-blue-400 border-blue-800',
  gray:   'bg-gray-800 text-gray-400 border-gray-700',
};

const statusMap: Record<string, { label: string; variant: string }> = {
  DRAFT:             { label: 'Rascunho',       variant: 'gray' },
  CHECKLIST_PENDING: { label: 'Checklist',       variant: 'blue' },
  ANALYSIS_PENDING:  { label: 'Análise',         variant: 'blue' },
  PENDING_APPROVAL:  { label: 'Revisão Gestor',  variant: 'yellow' },
  APPROVED:          { label: 'Aprovado',         variant: 'green' },
  REJECTED:          { label: 'Recusado',         variant: 'red' },
  SUBMITTED:         { label: 'Submetido',        variant: 'blue' },
  green:  { label: 'OK',       variant: 'green' },
  yellow: { label: 'Alerta',   variant: 'yellow' },
  orange: { label: 'Urgente',  variant: 'orange' },
  red:    { label: 'Vencido',  variant: 'red' },
};

export function Badge({ status, label }: { status: string; label?: string }) {
  const map = statusMap[status] ?? { label: status, variant: 'gray' };
  const cls = variants[map.variant] ?? variants.gray;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label ?? map.label}
    </span>
  );
}
