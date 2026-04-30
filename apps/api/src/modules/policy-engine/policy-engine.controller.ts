import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PolicyEngineService } from './policy-engine.service';
import { DeterministicScoreService } from './deterministic-score.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/auth/guards/tenant.guard';
import { ValidateEligibilityDto } from './dto/validate-eligibility.dto';
import { EvaluateChecklistDto } from './dto/evaluate-checklist.dto';

@Controller()
@UseGuards(AuthGuard)
export class PolicyEngineController {
  constructor(
    private policyEngine: PolicyEngineService,
    private deterministicScore: DeterministicScoreService,
  ) {}

  // ── GET /api/policies/:id ─────────────────────────────────────────────────
  // Retorna policy version com schema parsed — usada pelo frontend no passo 1
  @Get('policies/:id')
  async getPolicyVersion(@Param('id') id: string) {
    const { version, schema } = await this.policyEngine.getPolicyVersion(id);
    return {
      id: version.id,
      versionCode: version.versionCode,
      status: version.status,
      effectiveFrom: version.effectiveFrom,
      template: {
        id: version.template.id,
        name: version.template.name,
        manufacturer: version.template.manufacturer,
      },
      schema,
    };
  }

  // ── GET /api/manufacturers/:id/active-policy ──────────────────────────────
  // Retorna a policy ativa de uma montadora (usada pelo SetupPage)
  @Get('manufacturers/:id/active-policy')
  async getActivePolicyForManufacturer(@Param('id') manufacturerId: string) {
    const { version, schema } = await this.policyEngine.getActivePolicyForManufacturer(manufacturerId);
    return {
      policyVersionId: version.id,
      versionCode: version.versionCode,
      templateName: version.template.name,
      schema,
    };
  }

  // ── GET /api/tenants/:tenantId/active-policy ──────────────────────────────
  @Get('tenants/:tenantId/active-policy')
  @UseGuards(TenantGuard)
  async getActivePolicyForTenant(@Param('tenantId') tenantId: string) {
    const { version, schema } = await this.policyEngine.getActivePolicyForTenant(tenantId);
    return {
      policyVersionId: version.id,
      versionCode: version.versionCode,
      templateName: version.template.name,
      manufacturer: version.template.manufacturer,
      schema,
    };
  }

  // ── POST /api/policies/:id/validate-eligibility ───────────────────────────
  // Passo 1: valida dados do veículo contra a policy
  @Post('policies/:id/validate-eligibility')
  async validateEligibility(
    @Param('id') policyVersionId: string,
    @Body() dto: ValidateEligibilityDto,
  ) {
    const { schema } = await this.policyEngine.getPolicyVersion(policyVersionId);
    const result = this.policyEngine.validateEligibility(dto, schema);
    return result;
  }

  // ── GET /api/policies/:id/checklist ──────────────────────────────────────
  // Passo 2: retorna as questões do checklist dinâmico
  @Get('policies/:id/checklist')
  async getChecklist(@Param('id') policyVersionId: string) {
    const { schema } = await this.policyEngine.getPolicyVersion(policyVersionId);
    const items = this.policyEngine.generateChecklist(schema);
    return { policyVersionId, items };
  }

  // ── POST /api/policies/:id/evaluate-checklist ─────────────────────────────
  // Passo 2 completo: avalia respostas e retorna SD parcial
  @Post('policies/:id/evaluate-checklist')
  async evaluateChecklist(
    @Param('id') policyVersionId: string,
    @Body() dto: EvaluateChecklistDto,
  ) {
    const { schema } = await this.policyEngine.getPolicyVersion(policyVersionId);
    const sdResult = this.deterministicScore.calculate(dto.answers, schema);
    const decision = this.deterministicScore.getDecision(sdResult.score, schema, sdResult.bloqueantes);

    return {
      policyVersionId,
      scoreSd: sdResult.score,
      pontosObtidos: sdResult.pontosObtidos,
      pontosMaximos: sdResult.pontosMaximos,
      bloqueantes: sdResult.bloqueantes,
      regrasAplicadas: sdResult.regrasAplicadas,
      decisaoProvisoria: decision,
    };
  }

  // ── POST /api/policies/:id/composite-score ────────────────────────────────
  // Calcula score composto SD + ST + SH (chamado internamente no Passo 4)
  @Post('policies/:id/composite-score')
  async compositeScore(
    @Param('id') policyVersionId: string,
    @Body() body: { sd: number; st: number | null; sh: number; checklistAnswers: any[] },
  ) {
    const { schema } = await this.policyEngine.getPolicyVersion(policyVersionId);
    const sdResult = this.deterministicScore.calculate(body.checklistAnswers, schema);
    const scoreFinal = this.deterministicScore.calculateComposite(
      body.sd ?? sdResult.score,
      body.st,
      body.sh,
      schema,
    );
    const decision = this.deterministicScore.getDecision(scoreFinal, schema, sdResult.bloqueantes);

    return {
      scoreSd: body.sd ?? sdResult.score,
      scoreSt: body.st,
      scoreSh: body.sh,
      scoreFinal,
      pesos: { sd: schema.scoring.peso_sd, st: schema.scoring.peso_st, sh: schema.scoring.peso_sh },
      decision,
    };
  }
}
