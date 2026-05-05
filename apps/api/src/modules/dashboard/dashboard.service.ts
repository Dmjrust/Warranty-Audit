import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const OPEN_STATUSES = ['DRAFT', 'CHECKLIST_PENDING', 'ANALYSIS_PENDING', 'PENDING_APPROVAL'];
const CLOSED_STATUSES = ['APPROVED', 'REJECTED', 'SUBMITTED'];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalAbertos,
      totalPorStatus,
      slaEmRisco,
      scoresRecentes,
      aprovados30d,
      encerrados30d,
      tendenciaMensal,
      processosRecentes,
      notificacoesNaoLidas,
    ] = await Promise.all([
      // Total processos abertos
      this.prisma.processInstance.count({
        where: { tenantId, status: { in: OPEN_STATUSES } },
      }),

      // Contagem por status
      this.prisma.processInstance.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),

      // SLA em risco (laranja ou vermelho)
      this.prisma.processInstance.count({
        where: { tenantId, slaStatus: { in: ['orange', 'red'] }, status: { in: OPEN_STATUSES } },
      }),

      // Scores dos últimos 30 dias
      this.prisma.score.findMany({
        where: {
          process: { tenantId },
          calculatedAt: { gte: thirtyDaysAgo },
          scoreFinal: { not: null },
        },
        select: { scoreFinal: true },
      }),

      // Aprovados últimos 30 dias
      this.prisma.processInstance.count({
        where: {
          tenantId,
          status: { in: ['APPROVED', 'SUBMITTED'] },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Encerrados últimos 30 dias (aprovados + rejeitados)
      this.prisma.processInstance.count({
        where: {
          tenantId,
          status: { in: CLOSED_STATUSES },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Tendência mensal dos últimos 6 meses — aprovados por mês
      this.prisma.$queryRaw<{ mes: string; aprovados: bigint; total: bigint }[]>`
        SELECT
          TO_CHAR("updatedAt", 'YYYY-MM') AS mes,
          COUNT(*) FILTER (WHERE status IN ('APPROVED', 'SUBMITTED')) AS aprovados,
          COUNT(*) AS total
        FROM process_instances
        WHERE "tenantId" = ${tenantId}
          AND "updatedAt" >= ${sixMonthsAgo}
          AND status IN ('APPROVED', 'REJECTED', 'SUBMITTED')
        GROUP BY mes
        ORDER BY mes ASC
      `,

      // Últimos 5 processos
      this.prisma.processInstance.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          policyVersion: { include: { template: { include: { manufacturer: true } } } },
          scores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        },
      }),

      // Notificações não lidas
      this.prisma.notification.count({
        where: { tenantId, read: false },
      }),
    ]);

    const scoreMedio =
      scoresRecentes.length > 0
        ? Math.round(
            scoresRecentes.reduce((acc, s) => acc + (s.scoreFinal ?? 0), 0) /
              scoresRecentes.length,
          )
        : null;

    const taxaAprovacao =
      encerrados30d > 0 ? Math.round((aprovados30d / encerrados30d) * 100) : null;

    const statusMap = Object.fromEntries(
      totalPorStatus.map((g) => [g.status, g._count.status]),
    );

    return {
      kpis: {
        totalAbertos,
        slaEmRisco,
        scoreMedio,
        taxaAprovacao,
        notificacoesNaoLidas,
      },
      statusBreakdown: statusMap,
      tendenciaMensal: tendenciaMensal.map((t) => ({
        mes: t.mes,
        aprovados: Number(t.aprovados),
        total: Number(t.total),
      })),
      processosRecentes: processosRecentes.map((p) => ({
        id: p.id,
        status: p.status,
        slaStatus: p.slaStatus,
        createdAt: p.createdAt,
        manufacturer: p.policyVersion?.template?.manufacturer?.name ?? null,
        scoreFinal: p.scores?.[0]?.scoreFinal ?? null,
        vehicleData: p.vehicleDataJson ? JSON.parse(p.vehicleDataJson) : null,
      })),
    };
  }
}
