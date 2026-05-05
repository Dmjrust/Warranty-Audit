import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SlaScheduler, SLA_QUEUE } from './sla.scheduler';
import { SlaProcessor } from './sla.processor';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: SLA_QUEUE }),
    NotificationsModule,
    PrismaModule,
  ],
  providers: [SlaScheduler, SlaProcessor],
})
export class SlaModule {}
