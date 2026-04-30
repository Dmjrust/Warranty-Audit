import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PolicyEngineService } from '@/modules/policy-engine/policy-engine.service';
import { DeterministicScoreService } from '@/modules/policy-engine/deterministic-score.service';
import { CreateProcessDto } from './dto/create-process.dto';
import {
  UpdateVehicleStepDto,
  UpdateChecklistStepDto,
  UpdateAnalysisStepDto,
  UpdateVerdictStepDto,
} from './dto/update-step.dto';

@Injectable()
export class WarrantyProcessService {
  constructor(
    private prisma: PrismaService,
    private policyEngine: PolicyEngineService,
    private deterministicScore: DeterministicScoreService,
  ) {}

  async create(tenantId: string, dto: CreateProcessDto) {
    const { version, schema } = await this.policyEngine.getActivePolicyForTenant(tenantId);
    const slaDeadline = this.policyEngine.getSLADeadline(schema, new Date());

    const process = await this.prisma.processInstance.create({
      data: {
        tenantId,
        policyVersionId: version.id,
        status: 'DRAFT',
        currentStep: 'VEHICLE',
        slaDeadline,
        slaStatus: 'green',
        vehicleDataJson: dto.observacoes ? JSON.stringify({ observacoes: dto.observacoes }) : null,
      },
      include: { policyVersion: { include: { template: { include: { manufacturer: true } } } } },
    });

    return this.formatProcess(process);
  }

  async findAll(tenantId: string, filters?: { status?: string }) {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;

    const processes = await this.prisma.processInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policyVersion: { include: { template: { include: { manufacturer: true } } } },
        scores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      },
    });

    return processes.map((p) => {
      const slaStatus = p.slaDeadline
        ? this.policyEngine.getSLAStatus(p.slaDeadline)
        : 'green';
      return { ...this.formatProcess(p), slaStatus };
    });
  }

  async findOne(id: string, tenantId: string, isAdmin: boolean) {
    const process = await this.prisma.processInstance.findUnique({
      where: { id },
      include: {
        policyVersion: { include: { template: { include: { manufacturer: true } } } },
        scores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      },
    });

    if (!process) throw new NotFoundException(`Processo ${id} nao encontrado`);
    if (!isAdmin && process.tenantId !== tenantId) {
      throw new ForbiddenException('Acesso negado a este processo');
    }

    return this.formatProcess(process);
  }

  async saveVehicleStep(id: string, tenantId: string, dto: UpdateVehicleStepDto) {
    const process = await this.getOwnedProcess(id, tenantId);
    const { schema } = await this.policyEngine.getPolicyVersion(process.policyVersionId);

    const eligibility = this.policyEngine.validateEligibility(
      { vin: dto.vin, hodometro: dto.hodometro, modelo: dto.modelo },
      schema,
    );

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        vehicleDataJson: JSON.stringify({ ...dto, eligibility }),
        currentStep: eligibility.eligible ? 'CHECKLIST' : 'VEHICLE',
        status: eligibility.eligible ? 'CHECKLIST_PENDING' : 'DRAFT',
      },
    });

    return { processId: id, currentStep: updated.currentStep, eligibility, vehicleData: dto };
  }

  async saveChecklistStep(id: string, tenantId: string, dto: UpdateChecklistStepDto) {
    const process = await this.getOwnedProcess(id, tenantId);
    const { schema } = await this.policyEngine.getPolicyVersion(process.policyVersionId);

    const sdResult = this.deterministicScore.calculate(dto.answers, schema);

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        checklistDataJson: JSON.stringify({ answers: dto.answers, sdResult }),
        currentStep: 'ANALYSIS',
        status: 'ANALYSIS_PENDING',
      },
    });

    return {
      processId: id,
      currentStep: updated.currentStep,
      scoreSd: sdResult.score,
      bloqueantes: sdResult.bloqueantes,
      regrasAplicadas: sdResult.regrasAplicadas,
    };
  }

  async saveAnalysisStep(id: string, tenantId: string, dto: UpdateAnalysisStepDto) {
    const process = await this.getOwnedProcess(id, tenantId);

    if (!dto.imageUrls?.length) {
      const { schema } = await this.policyEngine.getPolicyVersion(process.policyVersionId);
      if (schema.passo3_analise_tecnica.requer_imagem) {
        throw new BadRequestException('Ao menos uma imagem de evidencia e obrigatoria para esta montadora');
      }
    }

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        analysisDataJson: JSON.stringify(dto),
        currentStep: 'VERDICT',
        status: 'PENDING_APPROVAL',
      },
    });

    return { processId: id, currentStep: updated.currentStep };
  }

  async saveVerdictStep(id: string, tenantId: string, dto: UpdateVerdictStepDto) {
    const process = await this.getOwnedProcess(id, tenantId);
    const { schema } = await this.policyEngine.getPolicyVersion(process.policyVersionId);

    const checklistData = process.checklistDataJson
      ? JSON.parse(process.checklistDataJson)
      : { sdResult: { score: 0, bloqueantes: [], regrasAplicadas: [] } };

    const sd = checklistData.sdResult?.score ?? 0;
    const bloqueantes = checklistData.sdResult?.bloqueantes ?? [];

    const scoreFinal = this.deterministicScore.calculateComposite(sd, dto.scoreSt, dto.scoreSh, schema);
    const decision = this.deterministicScore.getDecision(scoreFinal, schema, bloqueantes);

    const score = await this.prisma.score.create({
      data: {
        processId: id,
        policyVersionId: process.policyVersionId,
        scoreSd: sd,
        scoreSt: dto.scoreSt,
        scoreSh: dto.scoreSh,
        scoreFinal,
        decision: decision.decision,
        rulesApplied: JSON.stringify(checklistData.sdResult?.regrasAplicadas ?? []),
      },
    });

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        status: decision.canSubmit ? 'APPROVED' : 'PENDING_APPROVAL',
        currentStep: 'VERDICT',
        scoringResultJson: JSON.stringify({ sd, st: dto.scoreSt, sh: dto.scoreSh, final: scoreFinal }),
        decisionResultJson: JSON.stringify(decision),
      },
    });

    return {
      processId: id,
      status: updated.status,
      scoreSd: sd,
      scoreSt: dto.scoreSt,
      scoreSh: dto.scoreSh,
      scoreFinal,
      decision,
      scoreId: score.id,
    };
  }

  private async getOwnedProcess(id: string, tenantId: string) {
    const process = await this.prisma.processInstance.findUnique({ where: { id } });
    if (!process) throw new NotFoundException(`Processo ${id} nao encontrado`);
    if (process.tenantId !== tenantId) throw new ForbiddenException('Acesso negado');
    return process;
  }

  private formatProcess(p: any) {
    return {
      id: p.id,
      status: p.status,
      currentStep: p.currentStep,
      slaStatus: p.slaStatus,
      slaDeadline: p.slaDeadline,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      policyVersion: p.policyVersion
        ? {
            id: p.policyVersion.id,
            versionCode: p.policyVersion.versionCode,
            manufacturer: p.policyVersion.template?.manufacturer,
          }
        : null,
      vehicleData: p.vehicleDataJson ? JSON.parse(p.vehicleDataJson) : null,
      checklistData: p.checklistDataJson ? JSON.parse(p.checklistDataJson) : null,
      analysisData: p.analysisDataJson ? JSON.parse(p.analysisDataJson) : null,
      scoringResult: p.scoringResultJson ? JSON.parse(p.scoringResultJson) : null,
      decisionResult: p.decisionResultJson ? JSON.parse(p.decisionResultJson) : null,
      latestScore: p.scores?.[0] ?? null,
    };
  }
}
