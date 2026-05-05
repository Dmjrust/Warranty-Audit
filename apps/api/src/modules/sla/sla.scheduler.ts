import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';

const OPEN_STATUSES = ['DRAFT', 'CHECKLIST_PENDING', 'ANALYSIS_PENDING', 'PENDING_APPROVAL'];

export const SLA_QUEUE = 'sla-check';

@Injectable()
export class SlaScheduler {
  private readonly logger = new Logger(SlaScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(SLA_QUEUE) private slaQueue: Queue,
  ) {}

  // Run every 15 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async enqueueSlaChecks() {
    const processes = await this.prisma.processInstance.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        slaDeadline: { not: null },
      },
      select: { id: true, tenantId: true, slaDeadline: true, slaStatus: true },
    });

    this.logger.log(`Enqueuing SLA check for ${processes.length} open processes`);

    await Promise.all(
      processes.map((p) =>
        this.slaQueue.add(
          'check',
          { processId: p.id, tenantId: p.tenantId, slaDeadline: p.slaDeadline, previousStatus: p.slaStatus },
          { removeOnComplete: true, removeOnFail: 100 },
        ),
      ),
    );
  }
}
