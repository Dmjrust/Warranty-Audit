import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PolicyEngineModule } from './modules/policy-engine/policy-engine.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { WarrantyProcessModule } from './modules/warranty-process/warranty-process.module';
import { StorageModule } from './modules/storage/storage.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SlaModule } from './modules/sla/sla.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    // Infrastructure
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
      },
    }),
    PrismaModule,

    // Feature modules
    AuthModule,
    PolicyEngineModule,
    ManufacturersModule,
    WarrantyProcessModule,
    StorageModule,
    DashboardModule,
    NotificationsModule,
    SlaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
