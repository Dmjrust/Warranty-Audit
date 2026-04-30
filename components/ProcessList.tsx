
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcessStore } from '../store';
// Added FileText to the imports to resolve the compilation error
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock, 
  Eye,
  Edit2,
  Plus,
  FileText
} from 'lucide-react';
import { ProcessStatus } from '../types';

const StatusBadge = ({ status }: { status: ProcessStatus }) => {
  const configs = {
    [ProcessStatus.RASCUNHO]: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rascunho' },
    [ProcessStatus.EM_AUDITORIA]: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Em Auditoria' },
    [ProcessStatus.PRONTO_SUBMISSAO]: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Pronto' },
    [ProcessStatus.APROVADO]: { bg: 'bg-emerald-500', text: 'text-white', label: 'Aprovado' },
    [ProcessStatus.REJEITADO]: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Rejeitado' },
    [ProcessStatus.AGUARDANDO_CORRECAO]: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pendente' },
    [ProcessStatus.SUBMETIDO]: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Submetido' },
    [ProcessStatus.PARCIALMENTE_APROVADO]: { bg: 'bg-sky-50', text: 'text-sky-600', label: 'Parcial' },
  };

  const config = configs[status];
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const ProcessList = () => {
  const { processes } = useProcessStore();
  const navigate = useNavigate();
  const tenantId = localStorage.getItem('current_tenant_id');

  const handleCreateNew = async () => {
    if (!tenantId) {
      alert('Por favor, configure sua concessionária em Setup/Config antes de criar processos.');
      navigate('/settings');
      return;
    }

    try {
      const res = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (data.id) {
        navigate(`/processes/${data.id}`);
      } else {
        alert('Erro ao criar processo: Tenant não configurado corretamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Processos de Garantia</h1>
          <p className="text-slate-500 text-sm">Gerencie e audite seus processos de garantia.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Filter size={18} className="text-slate-400" />
            Filtros
          </button>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95"
          >
            <Plus size={18} />
            Novo Processo
          </button>
        </div>
      </div>

      <div className="aura-glass rounded-[32px] overflow-hidden shadow-sm border-slate-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">OS / Data</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Veículo / VIN</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processes.map((p) => (
              <tr key={p.id} className="hover:bg-brand-50/30 transition-colors group">
                <td className="px-6 py-6">
                  <p className="font-bold text-slate-900">{p.numeroOS}</p>
                  <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-1 uppercase">
                    <Clock size={12} /> {new Date(p.dataAbertura).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-6">
                  <p className="font-bold text-slate-700">{p.vinVeiculo}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">{p.montadoraId} • {p.hodometro.toLocaleString()} km</p>
                </td>
                <td className="px-6 py-6 text-center">
                  {p.scoreAuditoria ? (
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-500 font-black text-sm">
                      {p.scoreAuditoria}
                    </div>
                  ) : (
                    <span className="text-slate-300">--</span>
                  )}
                </td>
                <td className="px-6 py-6">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processes.length === 0 && (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4">
            <FileText size={48} className="opacity-10" />
            <p className="font-bold text-sm uppercase tracking-widest">Nenhum processo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessList;
