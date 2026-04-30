import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@/shared/enums';

@Injectable()
export class TenantGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === UserRole.ADMIN_PLATAFORMA) return true;

    const tenantIdFromRoute = request.params.tenantId || request.body?.tenantId;
    if (tenantIdFromRoute && user?.tenantId !== tenantIdFromRoute) {
      throw new ForbiddenException('Acesso negado a este tenant');
    }
    return true;
  }
}
