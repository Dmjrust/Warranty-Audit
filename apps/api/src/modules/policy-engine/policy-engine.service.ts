import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  PolicySchema,
  EligibilityResult,
  EligibilityViolation,
  ChecklistItem,
  ChecklistAnswer,
} from './types/policy.types';

@Injectable()
export class PolicyEngineService {
  constructor(private prisma: PrismaService) {}

  // ── Load ───────────────────────────────────────────────────────────────────

  async getPolicyVersion(policyVersionId: string): Promise<{ version: any; schema: PolicySchema }> {
    const version = await this.prisma.policyVersion.findUnique({
      where: { id: policyVersionId },
      include: { template: { include: { manufacturer: true } } },
    });

    if (!version) throw new NotFoundException(`Policy version ${policyVersionId} não encontrada`);

    return { version, schema: this.parseSchema(version.schemaJson) };
  }

  async getActivePolicyForManufacturer(manufacturerId: string): Promise<{ version: any; schema: PolicySchema }> {
    const version = await this.prisma.policyVersion.findFirst({
      where: {
        status: 'ACTIVE',
        template: { manufacturerId },
      },
      orderBy: { effectiveFrom: 'desc' },
      include: { template: { include: { manufacturer: true } } },
    });

    if (!version) {
      throw new NotFoundException(`Nenhuma policy ativa para o fabricante ${manufacturerId}`);
    }

    return { version, schema: this.parseSchema(version.schemaJson) };
  }

  async getActivePolicyForTenant(tenantId: string): Promise<{ version: any; schema: PolicySchema }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { activePolicyVersionId: true, manufacturerId: true },
    });

    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} não encontrado`);

    if (tenant.activePolicyVersionId) {
      return this.getPolicyVersion(tenant.activePolicyVersionId);
    }

    if (tenant.manufacturerId) {
      return this.getActivePolicyForManufacturer(tenant.manufacturerId);
    }

    throw new BadRequestException('Tenant não possui montadora configurada');
  }

  // ── Passo 1: Eligibility Validation ───────────────────────────────────────

  validateEligibility(
    vehicleData: { vin: string; hodometro: number; modelo?: string; [key: string]: any },
    schema: PolicySchema,
  ): EligibilityResult {
    const violations: EligibilityViolation[] = [];
    const warnings: string[] = [];
    const rules = schema.passo1_veiculo;

    // VIN format
    if (vehicleData.vin && rules.validacoes.vin_formato) {
      const regex = new RegExp(rules.validacoes.vin_formato);
      if (!regex.test(vehicleData.vin)) {
        violations.push({
          field: 'vin',
          message: `VIN inválido. Formato esperado: ${rules.validacoes.vin_formato}`,
          bloqueante: true,
        });
      }
    }

    // Hodômetro máximo
    if (vehicleData.hodometro !== undefined && rules.validacoes.hodometro_maximo !== undefined) {
      if (vehicleData.hodometro > rules.validacoes.hodometro_maximo) {
        violations.push({
          field: 'hodometro',
          message: `Hodômetro (${vehicleData.hodometro.toLocaleString('pt-BR')} km) excede o limite de cobertura (${rules.validacoes.hodometro_maximo.toLocaleString('pt-BR')} km)`,
          bloqueante: true,
        });
      } else if (vehicleData.hodometro > rules.validacoes.hodometro_maximo * 0.9) {
        warnings.push(`Hodômetro próximo ao limite de cobertura da policy`);
      }
    }

    // Modelo permitido
    if (vehicleData.modelo && rules.validacoes.modelos_permitidos?.length) {
      const modeloUpper = vehicleData.modelo.toUpperCase();
      const allowed = rules.validacoes.modelos_permitidos;
      const match = allowed.some((m) => modeloUpper.startsWith(m.toUpperCase()));
      if (!match) {
        violations.push({
          field: 'modelo',
          message: `Modelo "${vehicleData.modelo}" não coberto por esta policy. Modelos permitidos: ${allowed.join(', ')}`,
          bloqueante: true,
        });
      }
    }

    // Campos obrigatórios ausentes
    for (const campo of rules.campos_obrigatorios) {
      if (!vehicleData[campo] && vehicleData[campo] !== 0) {
        violations.push({
          field: campo,
          message: `Campo obrigatório ausente: ${campo}`,
          bloqueante: true,
        });
      }
    }

    const bloqueantes = violations.filter((v) => v.bloqueante);
    return {
      eligible: bloqueantes.length === 0,
      violations,
      warnings,
    };
  }

  // ── Passo 2: Checklist ────────────────────────────────────────────────────

  generateChecklist(schema: PolicySchema): ChecklistItem[] {
    return schema.passo2_checklist.questoes.map((q) => ({
      id: q.id,
      pergunta: q.pergunta,
      tipo: q.tipo,
      opcoes: q.opcoes,
      impacto_sd: q.impacto_sd,
      bloqueante: q.bloqueante,
      orientacao: q.orientacao,
    }));
  }

  evaluateChecklistAnswers(
    answers: ChecklistAnswer[],
    schema: PolicySchema,
  ): { partialSD: number; bloqueantes: string[]; regrasAplicadas: any[] } {
    const questoes = schema.passo2_checklist.questoes;
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    let pontosObtidos = 0;
    const bloqueantes: string[] = [];
    const regrasAplicadas: any[] = [];

    for (const q of questoes) {
      const answer = answerMap.get(q.id);
      if (answer === undefined) continue;

      // "Favorável" = boolean true, ou resposta afirmativa
      const favoravel = answer === true || answer === 'sim' || answer === 'yes';

      if (favoravel) {
        pontosObtidos += q.impacto_sd;
      } else if (q.bloqueante) {
        bloqueantes.push(q.id);
      }

      regrasAplicadas.push({
        questionId: q.id,
        pergunta: q.pergunta,
        answer,
        favoravel,
        pontosAdicionados: favoravel ? q.impacto_sd : 0,
      });
    }

    const pontosMaximos = questoes.reduce((sum, q) => sum + q.impacto_sd, 0);
    const partialSD = pontosMaximos > 0
      ? Math.round((pontosObtidos / pontosMaximos) * 100)
      : 0;

    return { partialSD, bloqueantes, regrasAplicadas };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private parseSchema(schemaJson: string): PolicySchema {
    try {
      return JSON.parse(schemaJson) as PolicySchema;
    } catch {
      throw new BadRequestException('Schema da policy inválido (JSON malformado)');
    }
  }

  getSLADeadline(schema: PolicySchema, openedAt: Date): Date {
    const deadline = new Date(openedAt);
    deadline.setDate(deadline.getDate() + schema.slas.prazo_abertura_dias);
    return deadline;
  }

  getSLAStatus(deadline: Date): 'green' | 'yellow' | 'orange' | 'red' {
    const now = new Date();
    const msRemaining = deadline.getTime() - now.getTime();
    const hoursRemaining = msRemaining / (1000 * 60 * 60);
    const totalHours = 24 * 30; // approx from prazo_abertura_dias default
    const pctRemaining = msRemaining / (totalHours * 60 * 60 * 1000);

    if (hoursRemaining <= 0) return 'red';
    if (hoursRemaining <= 48) return 'orange';
    if (pctRemaining <= 0.3) return 'yellow';
    return 'green';
  }
}
