import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleCode } from '../enums/role-code.enum';
import { PermissionDeniedException } from '../exceptions/custom-exceptions';
import { CurrentUserWithAssignment } from '../interfaces/current-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserWithAssignment;

    if (!user || !user.activeRoleCode) {
      throw new PermissionDeniedException(request.path);
    }

    const hasRole = requiredRoles.includes(user.activeRoleCode);
    if (!hasRole) {
      throw new PermissionDeniedException(request.path);
    }

    return true;
  }
}
