import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ManufacturersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.manufacturer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        _count: { select: { tenants: true, templates: true } },
      },
    });
  }

  async findOne(id: string) {
    const manufacturer = await this.prisma.manufacturer.findUnique({
      where: { id },
      include: {
        templates: {
          include: {
            versions: {
              where: { status: 'ACTIVE' },
              orderBy: { effectiveFrom: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!manufacturer) throw new NotFoundException(`Montadora ${id} não encontrada`);
    return manufacturer;
  }

  async getPolicyVersions(manufacturerId: string) {
    const versions = await this.prisma.policyVersion.findMany({
      where: {
        template: { manufacturerId },
      },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { name: true, code: true } } },
    });

    return versions.map((v) => ({
      id: v.id,
      versionCode: v.versionCode,
      status: v.status,
      effectiveFrom: v.effectiveFrom,
      effectiveTo: v.effectiveTo,
      templateName: v.template.name,
      publishedAt: v.publishedAt,
    }));
  }
}
