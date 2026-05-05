import { Module } from '@nestjs/common';
import { PolicyEngineController } from './policy-engine.controller';
import { PolicyEngineService } from './policy-engine.service';
import { DeterministicScoreService } from './deterministic-score.service';

@Module({
  controllers: [PolicyEngineController],
  providers: [PolicyEngineService, DeterministicScoreService],
  exports: [PolicyEngineService, DeterministicScoreService],
})
export class PolicyEngineModule {}
