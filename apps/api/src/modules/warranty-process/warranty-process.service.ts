import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PolicyEngineService } from '@/modules/policy-engine/policy-engine.service';
import { DeterministicScoreService } from '@/modules/policy-engine/deterministic-score.service';
import { AiAnalysisService } from '@/modules/ai-analysis/ai-analysis.service';
import { HistoryScoreService } from '@/modules/history-score/history-score.service';
import { CreateProcessDto } from './dto/create-process.dto';
import {
  UpdateVehicleStepDto,
  UpdateChecklistStepDto,
  UpdateAnalysisStepDto,
  UpdateVerdictStepDto,
} from './dto/update-step.dto';

@Injectable()
export class WarrantyProcessService {
  private readonly logger = new Logger(WarrantyProcessService.name);

  constructor(
    private prisma: PrismaService,
    private policyEngine: PolicyEngineService,
    private deterministicScore: DeterministicScoreService,
    private aiAnalysis: AiAnalysisService,
    private historyScore: HistoryScoreService,
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
    const { schema, version } = await this.policyEngine.getPolicyVersion(process.policyVersionId);

    if (!dto.imageUrls?.length && schema.passo3_analise_tecnica.requer_imagem) {
      throw new BadRequestException('Ao menos uma imagem de evidencia e obrigatoria para esta montadora');
    }

    // Resolve manufacturer for RAG context
    const policyVersion = await this.prisma.policyVersion.findUnique({
      where: { id: process.policyVersionId },
      include: { template: { include: { manufacturer: true } } },
    });
    const manufacturer = policyVersion?.template?.manufacturer;

    const vehicleData = process.vehicleDataJson ? JSON.parse(process.vehicleDataJson) : {};

    // Run AI analysis — never blocks the workflow if it fails
    let aiResult: any = null;
    try {
      aiResult = await this.aiAnalysis.analyze({
        montadoraId: manufacturer?.id ?? '',
        montadoraNome: manufacturer?.name ?? '',
        modeloVeiculo: vehicleData.modelo ?? '',
        anoFabricacao: vehicleData.anoFabricacao,
        hodometro: vehicleData.hodometro,
        sistema: vehicleData.sistema ?? '',
        codigosFalha: vehicleData.codigosFalha,
        sintomas: dto.sintomas,
        inspecaoInicial: dto.inspecaoInicial,
        testesRealizados: dto.testesRealizados,
        causaRaiz: dto.causaRaiz,
        historicoIntervencoes: dto.historicoIntervencoes,
        imageUrls: dto.imageUrls,
      });
    } catch (err: any) {
      this.logger.warn(`AI analysis skipped for process ${id}: ${err.message}`);
    }

    const analysisData = { ...dto, aiResult };

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        analysisDataJson: JSON.stringify(analysisData),
        currentStep: 'VERDICT',
        status: 'PENDING_APPROVAL',
      },
    });

    return {
      processId: id,
      currentStep: updated.currentStep,
      aiResult,
    };
  }

  async getHistoryScore(tenantId: string): Promise<{ scoreSh: number }> {
    const scoreSh = await this.historyScore.calculate(tenantId);
    return { scoreSh };
  }

  async saveVerdictStep(id: string, tenantId: string, dto: UpdateVerdictStepDto) {
    const process = await this.getOwnedProcess(id, tenantId);
    const { schema } = await this.policyEngine.getPolicyVersion(process.policyVersionId);

    const checklistData = process.checklistDataJson
      ? JSON.parse(process.checklistDataJson)
      : { sdResult: { score: 0, bloqueantes: [], regrasAplicadas: [] } };

    const analysisData = process.analysisDataJson ? JSON.parse(process.analysisDataJson) : {};

    const sd = checklistData.sdResult?.score ?? 0;
    const bloqueantes = checklistData.sdResult?.bloqueantes ?? [];

    // Prefer AI-derived ST if not explicitly overridden in dto
    const scoreSt = dto.scoreSt ?? analysisData.aiResult?.scoreTecnico ?? null;

    // Auto-calculate SH if not provided
    let scoreSh = dto.scoreSh;
    if (scoreSh == null) {
      scoreSh = await this.historyScore.calculate(process.tenantId);
    }

    const scoreFinal = this.deterministicScore.calculateComposite(sd, scoreSt, scoreSh, schema);
    const decision = this.deterministicScore.getDecision(scoreFinal, schema, bloqueantes);

    const ragChunksUsed = analysisData.aiResult?.ragChunkIds
      ? JSON.stringify(analysisData.aiResult.ragChunkIds)
      : null;

    const score = await this.prisma.score.create({
      data: {
        processId: id,
        policyVersionId: process.policyVersionId,
        scoreSd: sd,
        scoreSt: scoreSt,
        scoreSh: scoreSh,
        scoreFinal,
        decision: decision.decision,
        rulesApplied: JSON.stringify(checklistData.sdResult?.regrasAplicadas ?? []),
        ragChunksUsed,
      },
    });

    const updated = await this.prisma.processInstance.update({
      where: { id },
      data: {
        status: decision.canSubmit ? 'APPROVED' : 'PENDING_APPROVAL',
        currentStep: 'VERDICT',
        scoringResultJson: JSON.stringify({ sd, st: scoreSt, sh: scoreSh, final: scoreFinal }),
        decisionResultJson: JSON.stringify(decision),
      },
    });

    return {
      processId: id,
      status: updated.status,
      scoreSd: sd,
      scoreSt: scoreSt,
      scoreSh: scoreSh,
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
