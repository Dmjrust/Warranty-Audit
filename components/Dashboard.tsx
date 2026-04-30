
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  Calendar,
  Users,
  DollarSign,
  Package,
  RotateCcw,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

const kpis = [
  { label: 'Processos Totais', value: '14.289', trend: '+2.5%', isUp: true, icon: Users },
  { label: 'Valor Auditado', value: 'R$ 8.465 M', trend: '+0.5%', isUp: true, icon: DollarSign },
  { label: 'Score Médio', value: '82.4', trend: '-0.2%', isUp: false, icon: Package },
  { label: 'Taxa Rejeição', value: '12.8%', trend: '+0.12%', isUp: true, icon: RotateCcw },
];

const salesData = [
  { name: '1 Jul', margin: 25000, revenue: 38000 },
  { name: '2 Jul', margin: 32000, revenue: 45000 },
  { name: '3 Jul', margin: 20000, revenue: 58000 },
  { name: '4 Jul', margin: 35000, revenue: 42000 },
  { name: '5 Jul', margin: 55000, revenue: 52000 },
  { name: '6 Jul', margin: 60000, revenue: 58000 },
  { name: '7 Jul', margin: 28000, revenue: 40000 },
  { name: '8 Jul', margin: 45000, revenue: 52000 },
  { name: '9 Jul', margin: 30000, revenue: 38000 },
  { name: '10 Jul', margin: 50000, revenue: 55000 },
  { name: '11 Jul', margin: 35000, revenue: 48000 },
  { name: '12 Jul', margin: 65000, revenue: 60000 },
];

const categoryData = [
  { name: 'Motor', value: 25, color: '#8B5CF6' },
  { name: 'Transmissão', value: 17, color: '#3B82F6' },
  { name: 'Suspensão', value: 13, color: '#006044' },
  { name: 'Eletroeletrônica', value: 12, color: '#6366F1' },
  { name: 'Cabine', value: 11, color: '#F43F5E' },
  { name: 'Chassi', value: 10, color: '#F59E0B' },
  { name: 'Outros', value: 12, color: '#94A3B8' },
];

const countryData = [
  { name: 'São Paulo', value: '45%' },
  { name: 'Minas Gerais', value: '19%' },
  { name: 'Paraná', value: '15%' },
  { name: 'Santa Catarina', value: '13%' },
  { name: 'Rio Grande do Sul', value: '12%' },
  { name: 'Goiás', value: '11%' },
  { name: 'Bahia', value: '10%' },
];

const Dashboard = () => {
  return (
    <div className="space-y-10">
      {/* Header with Date Filter */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
          <Calendar size={16} />
          <span>Últimos 30 dias</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="aura-glass p-5 rounded-2xl flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <kpi.icon size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-xl font-extrabold text-slate-900">{kpi.value}</span>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${kpi.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {kpi.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.trend}
              </div>
            </div>
          </motion.div>
        ))}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all group p-5">
          <div className="p-1 bg-slate-100 rounded-md text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
            <Plus size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-700 uppercase">Adicionar métrica</span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="aura-glass p-8 rounded-3xl">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-lg font-extrabold text-slate-900">Evolução Diária</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-500 rounded-full" />
              <span className="text-xs font-bold text-slate-600 tracking-tight">Recuperado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full" />
              <span className="text-xs font-bold text-slate-600 tracking-tight">Auditado</span>
            </div>
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} tickFormatter={(value) => `${value / 1000}K`} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 800 }}
              />
              <Bar dataKey="margin" fill="#006044" radius={[4, 4, 0, 0]} barSize={10} />
              <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Share */}
        <div className="aura-glass p-8 rounded-3xl">
          <h3 className="text-lg font-extrabold text-slate-900 mb-8">Processos por Categoria</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="space-y-4 flex-1">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{cat.value}%</span>
                </div>
              ))}
            </div>
            <div className="h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Region Breakdown */}
        <div className="aura-glass p-8 rounded-3xl">
          <h3 className="text-lg font-extrabold text-slate-900 mb-8">Volume por Região</h3>
          <div className="space-y-5">
            {countryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500/30 group-hover:bg-brand-500 transition-colors" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
