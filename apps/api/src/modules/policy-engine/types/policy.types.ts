// TypeScript interfaces that mirror the PolicyVersion.schemaJson structure.
// Every field here corresponds to what the seed and future policy uploads produce.

export interface PolicySLA {
  prazo_abertura_dias: number;
  prazo_analise_dias: number;
  prazo_submissao_dias: number;
}

export interface PolicyVehicleField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

export interface PolicyVehicleValidations {
  vin_formato?: string;          // regex string
  hodometro_maximo?: number;
  modelos_permitidos?: string[];
}

export interface PolicyStep1Vehicle {
  campos_obrigatorios: string[];
  validacoes: PolicyVehicleValidations;
}

export interface PolicyChecklistQuestion {
  id: string;
  pergunta: string;
  tipo: 'boolean' | 'select' | 'number' | 'text';
  opcoes?: string[];             // for 'select' type
  impacto_sd: number;            // points added to SD when answer is favorable
  bloqueante: boolean;           // if true, wrong answer blocks submission
  orientacao?: string;           // guidance shown to the technician
}

export interface PolicyStep2Checklist {
  questoes: PolicyChecklistQuestion[];
}

export interface PolicyStep3AnalysisTechnica {
  campos_obrigatorios: string[];
  requer_imagem: boolean;
  sistemas_cobertos: string[];
}

export interface PolicyScoringLimits {
  aprovado_automatico: number;
  revisao_manual_min: number;
  revisao_manual_max: number;
  recusado_automatico: number;
}

export interface PolicyScoring {
  peso_sd: number;
  peso_st: number;
  peso_sh: number;
  limites_decisao: PolicyScoringLimits;
}

export interface PolicySchema {
  manufacturer: string;
  policyCode: string;
  version: string;
  slas: PolicySLA;
  passo1_veiculo: PolicyStep1Vehicle;
  passo2_checklist: PolicyStep2Checklist;
  passo3_analise_tecnica: PolicyStep3AnalysisTechnica;
  scoring: PolicyScoring;
}

// ── Eligibility ───────────────────────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  violations: EligibilityViolation[];
  warnings: string[];
}

export interface EligibilityViolation {
  field: string;
  message: string;
  bloqueante: boolean;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  pergunta: string;
  tipo: PolicyChecklistQuestion['tipo'];
  opcoes?: string[];
  impacto_sd: number;
  bloqueante: boolean;
  orientacao?: string;
}

export interface ChecklistAnswer {
  questionId: string;
  answer: boolean | string | number;
}

// ── SD Score ──────────────────────────────────────────────────────────────────

export interface SDScoreResult {
  score: number;                 // 0–100
  pontosObtidos: number;
  pontosMaximos: number;
  regrasAplicadas: SDRuleLog[];
  bloqueantes: string[];         // IDs of blocking questions answered unfavorably
}

export interface SDRuleLog {
  questionId: string;
  pergunta: string;
  answer: boolean | string | number;
  favoravel: boolean;
  pontosAdicionados: number;
}
