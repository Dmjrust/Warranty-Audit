
export enum UserRole {
  CONSULTOR = 'CONSULTOR',
  CONSULTOR_SENIOR = 'CONSULTOR_SENIOR',
  ANALISTA_GARANTIA = 'ANALISTA_GARANTIA',
  GESTOR = 'GESTOR',
  ADMIN = 'ADMIN'
}

export enum ProcessStatus {
  RASCUNHO = 'RASCUNHO',
  EM_AUDITORIA = 'EM_AUDITORIA',
  AGUARDANDO_CORRECAO = 'AGUARDANDO_CORRECAO',
  PRONTO_SUBMISSAO = 'PRONTO_SUBMISSAO',
  SUBMETIDO = 'SUBMETIDO',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  PARCIALMENTE_APROVADO = 'PARCIALMENTE_APROVADO'
}

export enum ValidationSeverity {
  BLOQUEANTE = 'BLOQUEANTE',
  ALERTA = 'ALERTA',
  INFO = 'INFO'
}

export enum ValidationType {
  DOCUMENTAL = 'DOCUMENTAL',
  TECNICA = 'TECNICA',
  FINANCEIRA = 'FINANCEIRA'
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: ValidationSeverity;
  points: number;
  message: string;
  guidance?: string;
}

export interface AuditResult {
  scoreTotal: number;
  scoreSD: number;
  scoreST: number;
  scoreSH: number;
  nivelConfianca: number;
  riscoGlosa: 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
  completudeDocumental: number;
  consistenciaTecnica: number;
  canSubmit: boolean;
  naoConformidades: ValidationResult[];
  bloqueadores: ValidationResult[];
}

export interface ProcessoGarantia {
  id: string;
  numeroOS: string;
  dataAbertura: string;
  vinVeiculo: string;
  hodometro: number;
  tipoFalha: string;
  componentePrincipal: string;
  sintomas: string;
  causaRaiz: string;
  testesRealizados: string;
  status: ProcessStatus;
  scoreAuditoria?: number;
  montadoraId: string;
  pecasSubstituidas: any[];
  maoDeObra: any[];
}
