import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule],
  providers: [PrismaService],
})
export class AppModule {}
