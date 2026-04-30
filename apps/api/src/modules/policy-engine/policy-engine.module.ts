import { Module } from '@nestjs/common';
import { PolicyEngineController } from './policy-engine.controller';
import { PolicyEngineService } from './policy-engine.service';
import { DeterministicScoreService } from './deterministic-score.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [PolicyEngineController],
  providers: [PolicyEngineService, DeterministicScoreService, PrismaService],
  exports: [PolicyEngineService, DeterministicScoreService],
})
export class PolicyEngineModule {}
