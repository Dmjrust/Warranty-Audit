import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export type NotificationType = 'SLA_YELLOW' | 'SLA_ORANGE' | 'SLA_RED';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, processId: string, type: NotificationType, message: string) {
    return this.prisma.notification.create({
      data: { tenantId, processId, type, message },
    });
  }

  async findUnread(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { id, tenantId },
      data: { read: true },
    });
  }

  async markAllRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
  }

  async countUnread(tenantId: string): Promise<number> {
    return this.prisma.notification.count({ where: { tenantId, read: false } });
  }
}
