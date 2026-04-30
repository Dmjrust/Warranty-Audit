
import { create } from 'zustand';
import { UserRole, ProcessoGarantia, ProcessStatus } from './types';

interface AuthState {
  user: { id: string; nome: string; role: UserRole; concessionaria: string } | null;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: '1', nome: 'Ricardo Silva', role: UserRole.CONSULTOR, concessionaria: 'TransTruck SP' },
  isAuthenticated: true,
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface ProcessStore {
  processes: ProcessoGarantia[];
  addProcess: (process: ProcessoGarantia) => void;
  updateProcess: (id: string, updates: Partial<ProcessoGarantia>) => void;
}

export const useProcessStore = create<ProcessStore>((set) => ({
  processes: [
    {
      id: 'p1',
      numeroOS: 'OS-8829',
      dataAbertura: new Date().toISOString(),
      vinVeiculo: '9BWZZZ31ZGA000123',
      hodometro: 125000,
      tipoFalha: 'Motor',
      componentePrincipal: 'Turbo Compressor',
      sintomas: 'Fumaça excessiva e perda de potência',
      causaRaiz: 'Vazamento de óleo no retentor do eixo do turbo',
      testesRealizados: 'Medição de pressão de turbo e inspeção visual',
      status: ProcessStatus.EM_AUDITORIA,
      scoreAuditoria: 82,
      montadoraId: 'Volvo',
      pecasSubstituidas: [],
      maoDeObra: []
    }
  ],
  addProcess: (process) => set((state) => ({ processes: [...state.processes, process] })),
  updateProcess: (id, updates) => set((state) => ({
    processes: state.processes.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
}));
