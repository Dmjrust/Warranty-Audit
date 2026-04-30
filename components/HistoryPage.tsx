
import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Truck,
  Box
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProcessStore } from '../store';
import { ProcessStatus } from '../types';

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    [ProcessStatus.APROVADO]: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Aprovado', icon: ShieldCheck },
    [ProcessStatus.REJEITADO]: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Recusa Técnica', icon: ShieldAlert },
    [ProcessStatus.PRONTO_SUBMISSAO]: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Para Revisão', icon: History },
  };

  const config = configs[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: History };
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const HistoryPage = () => {
  const { processes } = useProcessStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter for completed or advanced status processes
  const historyItems = processes
    .filter(p => [ProcessStatus.PRONTO_SUBMISSAO, ProcessStatus.SUBMETIDO, ProcessStatus.APROVADO, ProcessStatus.REJEITADO].includes(p.status))
    .filter(p => 
      p.numeroOS.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.vinVeiculo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime());

  const stats = {
    total: historyItems.length,
    approved: historyItems.filter(p => p.status === ProcessStatus.APROVADO).length,
    rejected: historyItems.filter(p => p.status === ProcessStatus.REJEITADO).length,
    avgScore: historyItems.length > 0 
      ? (historyItems.reduce((acc, curr) => acc + (curr.scoreAuditoria || 0), 0) / historyItems.length).toFixed(1)
      : '0'
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <History className="text-brand-500" size={28} />
            Histórico de Auditorias
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Rastreabilidade completa de todas as decisões técnicas tomadas.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por OS ou VIN..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none w-72 shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} /> Filtros Avançados
          </button>
        </div>
      </div>

      {/* Mini Dashboard for History */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Auditado', value: stats.total, icon: Box, color: 'text-brand-500', bg: 'bg-brand-50/50' },
          { label: 'Índice Aprovação', value: stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(0)}%` : '0%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
          { label: 'Rejeição Técnica', value: stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(0)}%` : '0%', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50/50' },
          { label: 'Média de Score', value: stats.avgScore, icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50/50' },
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="aura-glass p-6 rounded-[32px] flex items-center gap-5"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
              <item.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="aura-glass rounded-[40px] overflow-hidden shadow-sm border-slate-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Protocolo / Data</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Veículo & Componente</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">IA Score</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Feedback / Status</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {historyItems.map((p) => (
              <tr key={p.id} className="hover:bg-brand-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-500 transition-all">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">OS: {p.numeroOS}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(p.dataAbertura).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="font-bold text-slate-700 text-sm uppercase">{p.vinVeiculo}</p>
                  <p className="text-[11px] font-bold text-brand-500 mt-1 uppercase tracking-tight">{p.componentePrincipal || 'Motor / Geral'}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-center">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                      (p.scoreAuditoria || 0) >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      (p.scoreAuditoria || 0) >= 60 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {p.scoreAuditoria || '--'}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    <StatusBadge status={p.status} />
                    {p.status === ProcessStatus.REJEITADO && (
                      <p className="text-[10px] font-medium text-rose-400 leading-tight italic truncate max-w-[200px]">
                        "Inconsistência técnica evidente na imagem da falha."
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-lg shadow-slate-900/10">
                     Ver Detalhes
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {historyItems.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200">
              <History size={40} />
            </div>
            <div className="space-y-1">
              <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Histórico Vazio</p>
              <p className="text-slate-400 text-xs font-medium">As auditorias finalizadas aparecerão automaticamente aqui.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
