
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Moon,
  Sun,
  History,
  Users,
  Tag,
  Wallet,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store';
import Dashboard from './components/Dashboard';
import ProcessWizard from './components/ProcessWizard';
import ProcessList from './components/ProcessList';
import SetupPage from './components/SetupPage';
import HistoryPage from './components/HistoryPage';
import DebugPage from './components/DebugPage';

const SidebarSectionTitle = ({ title }: { title: string }) => (
  <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">
    {title}
  </p>
);

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active 
        ? 'sidebar-item-active' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </Link>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 flex flex-col px-4 py-6">
        <div className="flex items-center justify-between px-2 mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-brand-700 leading-tight">
                Warranty <span className="text-brand-500/50">Audit</span>
              </span>
              <span className="text-[10px] italic text-slate-400 font-medium tracking-wide leading-none">
                By Dsys
              </span>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-500">
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <SidebarSectionTitle title="Geral" />
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          
          <SidebarSectionTitle title="Auditoria" />
          <SidebarLink to="/processes" icon={FileText} label="Processos" active={location.pathname.startsWith('/processes')} />
          <SidebarLink to="/history" icon={History} label="Histórico" active={location.pathname === '/history'} />
          <SidebarLink to="/rules" icon={Tag} label="Regras" active={location.pathname === '/rules'} />
          
          <SidebarSectionTitle title="Financeiro" />
          <SidebarLink to="/billing" icon={Wallet} label="Faturamento" active={location.pathname === '/billing'} />
          <SidebarLink to="/transfers" icon={Calculator} label="Repasses" active={location.pathname === '/transfers'} />
          
          <SidebarSectionTitle title="Sistema" />
          <SidebarLink to="/consultants" icon={Users} label="Consultores" active={location.pathname === '/consultants'} />
          <SidebarLink to="/settings" icon={Settings} label="Setup / Config" active={location.pathname === '/settings'} />
          
          <div className="mt-4 px-4 py-3 flex items-center justify-between border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              Dark mode
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-10 h-5 rounded-full transition-all duration-300 relative ${isDarkMode ? 'bg-brand-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nome}`} alt="avatar" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.nome}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{user?.role}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 w-full px-2 py-3 mt-4 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold">
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 bg-[#f9fafb]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/processes" element={<ProcessList />} />
          <Route path="/processes/new" element={<ProcessWizard />} />
          <Route path="/processes/:id" element={<ProcessWizard />} />
          <Route path="/rules" element={<DebugPage />} />
          <Route path="/settings" element={<SetupPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/consultants" element={<Dashboard />} />
          <Route path="/billing" element={<Dashboard />} />
          <Route path="/transfers" element={<Dashboard />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
