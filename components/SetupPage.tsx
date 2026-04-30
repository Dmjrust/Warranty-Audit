import React, { useState, useEffect } from 'react';
import { Building2, Save, ArrowRight, ShieldCheck, Factory } from 'lucide-react';
import { motion } from 'framer-motion';

const SetupPage = () => {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('current_tenant_id'));

  useEffect(() => {
    const initSetup = async () => {
      try {
        const manufacturersPromise = fetch('/api/manufacturers').then(res => res.json());
        const tenantPromise = tenantId 
          ? fetch(`/api/tenants/${tenantId}`).then(res => res.json()) 
          : Promise.resolve(null);

        const [mList, tData] = await Promise.all([manufacturersPromise, tenantPromise]);

        setManufacturers(mList || []);
        if (tData) {
          setTenantName(tData.name || '');
          if (tData.manufacturerId) setSelectedManufacturer(tData.manufacturerId);
        }
      } catch (err) {
        console.error("Setup initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initSetup();
  }, [tenantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let tId = tenantId;
      
      // Step 1: Create or Get Tenant
      if (!tId) {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tenantName })
        });
        const data = await res.json();
        tId = data.id;
        setTenantId(tId);
        if (tId) localStorage.setItem('current_tenant_id', tId);
      }

      // Step 2: Update Setup (Binding Manufacturer and Policy)
      await fetch(`/api/tenants/${tId}/setup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturerId: selectedManufacturer })
      });

      alert('Setup da concessionária salvo com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar setup.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
        <header className="space-y-2">
          <div className="h-10 bg-slate-100 rounded-xl w-2/3"></div>
          <div className="h-4 bg-slate-50 rounded-lg w-full"></div>
        </header>

        <div className="aura-glass p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-3 bg-slate-50 rounded w-24"></div>
              <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-50 rounded w-24"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="h-24 bg-slate-50 rounded-2xl"></div>
                <div className="h-24 bg-slate-50 rounded-2xl"></div>
                <div className="h-24 bg-slate-50 rounded-2xl"></div>
              </div>
            </div>
          </div>
          <div className="h-14 bg-slate-100 rounded-[20px] w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Setup da Concessionária</h1>
        <p className="text-slate-500 font-medium">Configure os parâmetros base do seu tenant e vincule-se às políticas da montadora.</p>
      </header>

      <div className="aura-glass p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} /> Nome da Concessionária
            </label>
            <input 
              type="text" 
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="Ex: Eurobike Volvo SP"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Factory size={12} /> Selecione a Montadora
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {manufacturers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedManufacturer(m.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    selectedManufacturer === m.id 
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/10' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedManufacturer === m.id ? 'bg-brand-500 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                    <ShieldCheck size={18} />
                   </div>
                   <span className={`text-[11px] font-black uppercase tracking-tighter ${selectedManufacturer === m.id ? 'text-brand-700' : 'text-slate-500'}`}>
                     {m.name}
                   </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={saving || !tenantName || !selectedManufacturer}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-brand-500 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10"
          >
            {saving ? 'Gravando...' : (
              <>
                <Save size={18} /> Salvar Parâmetros
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-[24px] flex gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Aviso Importante</p>
          <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
            Alterar a montadora irá mudar a Policy ativa para novos processos. Processos já abertos permanecerão travados na versão da policy em que foram criados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
