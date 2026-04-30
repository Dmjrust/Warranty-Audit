import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PolicyEngineModule } from './modules/policy-engine/policy-engine.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { WarrantyProcessModule } from './modules/warranty-process/warranty-process.module';
import { StorageModule } from './modules/storage/storage.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    PolicyEngineModule,
    ManufacturersModule,
    WarrantyProcessModule,
    StorageModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
