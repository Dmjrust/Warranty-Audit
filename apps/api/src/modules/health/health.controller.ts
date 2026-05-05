import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();
    let dbOk = false;
    let dbLatencyMs = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbOk = false;
    }

    const status = dbOk ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks: {
        database: { status: dbOk ? 'ok' : 'error', latencyMs: dbLatencyMs },
        api: { status: 'ok' },
      },
    };
  }
}
