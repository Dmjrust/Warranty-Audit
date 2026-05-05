import { Module } from '@nestjs/common';
import { WarrantyProcessController } from './warranty-process.controller';
import { WarrantyProcessService } from './warranty-process.service';
import { PolicyEngineModule } from '@/modules/policy-engine/policy-engine.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { AiAnalysisModule } from '@/modules/ai-analysis/ai-analysis.module';
import { HistoryScoreModule } from '@/modules/history-score/history-score.module';

@Module({
  imports: [PolicyEngineModule, StorageModule, AiAnalysisModule, HistoryScoreModule],
  controllers: [WarrantyProcessController],
  providers: [WarrantyProcessService],
  exports: [WarrantyProcessService],
})
export class WarrantyProcessModule {}
