import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PolicyEngineModule } from './modules/policy-engine/policy-engine.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    PolicyEngineModule,
    ManufacturersModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
