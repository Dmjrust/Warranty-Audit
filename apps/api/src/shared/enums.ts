export enum UserRole {
  TECNICO = 'tecnico',
  GESTOR_GARANTIA = 'gestor_garantia',
  AUDITOR = 'auditor',
  ADMIN_TENANT = 'admin_tenant',
  ADMIN_PLATAFORMA = 'admin_plataforma',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProcessStatus {
  DRAFT = 'DRAFT',
  CHECKLIST_PENDING = 'CHECKLIST_PENDING',
  ANALYSIS_PENDING = 'ANALYSIS_PENDING',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUBMITTED = 'SUBMITTED',
}

export enum SLAStatus {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red',
}

export enum ChecklistItemType {
  BOOLEAN = 'boolean',
  SELECT = 'select',
  NUMBER = 'number',
  TEXT = 'text',
}

export enum AuditDecision {
  APPROVED = 'aprovado',
  REVIEW = 'revisao',
  HIGH_RISK = 'alto_risco',
  DO_NOT_SUBMIT = 'nao_submeter',
}
