import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Conta inativa');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async acceptInvite(token: string, name: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpiry: { gt: new Date() },
        status: 'PENDING',
      },
    });

    if (!user) throw new UnauthorizedException('Convite inválido ou expirado');

    const hash = await bcrypt.hash(password, 12);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        password: hash,
        status: 'ACTIVE',
        inviteToken: null,
        inviteExpiry: null,
      },
    });

    const jwtToken = this.jwt.sign({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
      tenantId: updated.tenantId,
    });

    return {
      token: jwtToken,
      user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, tenantId: true, status: true,
        tenant: { select: { id: true, name: true, manufacturerId: true } },
      },
    });
    return user;
  }
}
