import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // GET /api/dashboard
  @Get()
  getKpis(@Request() req: any) {
    return this.dashboardService.getKpis(req.user.tenantId);
  }
}
