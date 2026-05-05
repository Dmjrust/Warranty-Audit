import { Controller, Get, Patch, Param, Request, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // GET /api/notifications?unread=true
  @Get()
  findAll(@Request() req: any, @Query('unread') unread?: string) {
    if (unread === 'true') {
      return this.notificationsService.findUnread(req.user.tenantId);
    }
    return this.notificationsService.findAll(req.user.tenantId);
  }

  // GET /api/notifications/count
  @Get('count')
  countUnread(@Request() req: any) {
    return this.notificationsService
      .countUnread(req.user.tenantId)
      .then((count) => ({ count }));
  }

  // PATCH /api/notifications/:id/read
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.tenantId);
  }

  // PATCH /api/notifications/read-all
  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.tenantId);
  }
}
