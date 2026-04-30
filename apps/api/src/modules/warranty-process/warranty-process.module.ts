import { Module } from '@nestjs/common';
import { WarrantyProcessController } from './warranty-process.controller';
import { WarrantyProcessService } from './warranty-process.service';
import { PolicyEngineModule } from '@/modules/policy-engine/policy-engine.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  imports: [PolicyEngineModule, StorageModule],
  controllers: [WarrantyProcessController],
  providers: [WarrantyProcessService, PrismaService],
  exports: [WarrantyProcessService],
})
export class WarrantyProcessModule {}
