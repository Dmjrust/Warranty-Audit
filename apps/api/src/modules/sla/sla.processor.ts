import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService, NotificationType } from '@/modules/notifications/notifications.service';
import { SLA_QUEUE } from './sla.scheduler';

interface SlaJobData {
  processId: string;
  tenantId: string;
  slaDeadline: string;
  previousStatus: string;
}

// Hours remaining → SLA status
function computeSlaStatus(deadline: Date): string {
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft <= 0)   return 'red';
  if (hoursLeft <= 24)  return 'red';
  if (hoursLeft <= 48)  return 'orange';
  if (hoursLeft <= 96)  return 'yellow';
  return 'green';
}

const TRANSITION_MESSAGES: Record<string, (id: string) => string> = {
  yellow: (id) => `Processo ${id.slice(0, 8)} com SLA em atenção — menos de 4 dias para o prazo.`,
  orange: (id) => `Processo ${id.slice(0, 8)} com SLA em alerta — menos de 48 horas para o prazo.`,
  red:    (id) => `Processo ${id.slice(0, 8)} com SLA crítico — prazo esgotado ou em menos de 24 horas!`,
};

const TYPE_MAP: Record<string, NotificationType> = {
  yellow: 'SLA_YELLOW',
  orange: 'SLA_ORANGE',
  red:    'SLA_RED',
};

@Processor(SLA_QUEUE)
export class SlaProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<SlaJobData>) {
    const { processId, tenantId, slaDeadline, previousStatus } = job.data;
    const newStatus = computeSlaStatus(new Date(slaDeadline));

    // Always keep the DB status up-to-date
    await this.prisma.processInstance.update({
      where: { id: processId },
      data: { slaStatus: newStatus },
    });

    // Fire notification only on downgrade transitions (green→yellow, yellow→orange, orange/yellow→red)
    const degraded =
      (previousStatus === 'green'  && newStatus === 'yellow') ||
      (previousStatus === 'yellow' && newStatus === 'orange') ||
      (['green', 'yellow', 'orange'].includes(previousStatus) && newStatus === 'red');

    if (degraded) {
      const message = TRANSITION_MESSAGES[newStatus]?.(processId);
      if (message) {
        await this.notifications.create(tenantId, processId, TYPE_MAP[newStatus], message);
        this.logger.warn(`SLA ${newStatus.toUpperCase()} — process ${processId.slice(0, 8)} (tenant ${tenantId.slice(0, 8)})`);
      }
    }
  }
}
