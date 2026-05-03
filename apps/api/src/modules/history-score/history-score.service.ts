import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const SH_MIN = 20;
const SH_MAX = 95;
const LOOKBACK_MONTHS = 12;

@Injectable()
export class HistoryScoreService {
  constructor(private prisma: PrismaService) {}

  async calculate(tenantId: string): Promise<number> {
    const since = new Date();
    since.setMonth(since.getMonth() - LOOKBACK_MONTHS);

    const [total, approved] = await Promise.all([
      this.prisma.processInstance.count({
        where: {
          tenantId,
          createdAt: { gte: since },
          status: { in: ['APPROVED', 'REJECTED', 'SUBMITTED'] },
        },
      }),
      this.prisma.processInstance.count({
        where: {
          tenantId,
          createdAt: { gte: since },
          status: { in: ['APPROVED', 'SUBMITTED'] },
        },
      }),
    ]);

    if (total < 5) {
      // Too few processes to build a meaningful rate — return neutral score
      return 65;
    }

    const rate = approved / total;
    const raw = Math.round(rate * 100);
    return Math.min(SH_MAX, Math.max(SH_MIN, raw));
  }
}
