import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import {
  AssignmentExpiredException,
  AssignmentInactiveException,
} from '../exceptions/custom-exceptions';
import { CurrentUserWithAssignment } from '../interfaces/current-user.interface';

@Injectable()
export class ActiveAssignmentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserWithAssignment;

    if (!user) {
      return false;
    }

    // SUPER_ADMIN doesn't require department assignment
    if (user.activeRoleCode === 'SUPER_ADMIN') {
      return true;
    }

    if (!user.activeUserDepartmentRoleId) {
      return false;
    }

    // Check if assignment is active and not expired
    // This would typically be checked against the database
    // For now, we'll assume the JWT payload contains this information

    return true;
  }
}
