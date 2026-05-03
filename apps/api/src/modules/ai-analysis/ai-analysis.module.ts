import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';
import { Gpt4oService } from './gpt4o.service';
import { EmbeddingService } from './embedding.service';
import { RagEngineService } from './rag-engine.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AiAnalysisService, Gpt4oService, EmbeddingService, RagEngineService],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}
