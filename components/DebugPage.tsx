import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Database, Code, Copy, Check, FileJson, Layers, Cpu, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const DebugPage = () => {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [activePolicy, setActivePolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newProcessLoading, setNewProcessLoading] = useState(false);
  const [lastCreatedProcess, setLastCreatedProcess] = useState<any>(null);
  
  const tenantId = localStorage.getItem('current_tenant_id');

  const fetchData = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    
    try {
      const tRes = await fetch(`/api/tenants/${tenantId}`);
      const tData = await tRes.json();
      setTenant(tData);

      if (tData.activePolicyVersionId) {
        const pRes = await fetch(`/api/policy-versions/${tData.activePolicyVersionId}`);
        const pData = await pRes.json();
        setActivePolicy(pData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleCopy = () => {
    if (activePolicy) {
      navigator.clipboard.writeText(JSON.stringify(activePolicy.schemaJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateProcess = async () => {
    if (!tenantId) return;
    setNewProcessLoading(true);
    try {
      const res = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      setLastCreatedProcess(data);
      if (data.id) {
        setTimeout(() => navigate(`/processes/${data.id}`), 2000);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao criar processo via Policy.');
    } finally {
      setNewProcessLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Database size={48} className="text-slate-200" />
        <p className="text-slate-500 font-bold">Nenhum tenant configurado. Vá para Configurações primeiro.</p>
      </div>
    );
  }

  if (loading) return <div className="p-10 font-black text-slate-400 uppercase tracking-widest animate-pulse">Inspecionando Policy Stack...</div>;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Cpu className="text-brand-500" /> Regras & Policies
          </h1>
          <p className="text-slate-500 font-medium">Visualização técnica das políticas ativas vinculadas ao seu tenant.</p>
        </div>
        <button 
          onClick={handleCreateProcess}
          disabled={newProcessLoading}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 disabled:opacity-50"
        >
          <Play size={14} fill="white" /> {newProcessLoading ? 'Executando...' : 'Criar Novo Processo'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Stats */}
        <div className="aura-glass p-6 rounded-[32px] border border-slate-100 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-50">
            <Database size={12} /> Estado do Tenant
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Concessionária</span>
              <p className="text-sm font-black text-slate-800">{tenant?.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Montadora Ativa</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase">{tenant?.manufacturer?.code}</span>
                <span className="text-sm font-bold text-slate-600">{tenant?.manufacturer?.name}</span>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <Layers size={16} className="text-brand-500 mt-1" />
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Policy Version</span>
                  <p className="text-[11px] font-bold text-slate-600">{activePolicy?.versionCode || 'Nenhuma'}</p>
                  <p className="text-[8px] text-slate-400 font-mono truncate max-w-[150px]">{tenant?.activePolicyVersionId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Inspector */}
        <div className="lg:col-span-2 aura-glass p-1 rounded-[32px] border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 flex justify-between items-center bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <FileJson size={14} />
              </div>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Active Policy Schema (JSON)</span>
            </div>
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-900"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="flex-1 bg-slate-900 p-6 overflow-auto max-h-[500px] scrollbar-hide">
             <pre className="text-brand-400 font-mono text-[11px] leading-relaxed">
               {activePolicy ? JSON.stringify(activePolicy.schemaJson, null, 2) : '// Sem policy carregada'}
             </pre>
          </div>
        </div>
      </div>

      {lastCreatedProcess && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white border border-brand-100 rounded-[40px] shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500">
              <Play size={24} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Instância Criada com Sucesso</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vínculo de rastreabilidade estabelecido com Policy Version</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Process ID</span>
              <p className="text-xs font-mono font-bold text-slate-600 truncate">{lastCreatedProcess.id}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Tenant ID</span>
              <p className="text-xs font-mono font-bold text-slate-600 truncate">{lastCreatedProcess.tenantId}</p>
            </div>
             <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Policy Lock</span>
              <p className="text-xs font-mono font-bold text-slate-600 truncate">{lastCreatedProcess.policyVersionId}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DebugPage;
