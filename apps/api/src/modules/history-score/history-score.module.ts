import { Module } from '@nestjs/common';
import { HistoryScoreService } from './history-score.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HistoryScoreService],
  exports: [HistoryScoreService],
})
export class HistoryScoreModule {}
