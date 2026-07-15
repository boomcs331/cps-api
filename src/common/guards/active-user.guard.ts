import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import {
  UserInactiveException,
  UserLockedException,
} from '../exceptions/custom-exceptions';
import { CurrentUserWithAssignment } from '../interfaces/current-user.interface';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserWithAssignment;

    if (!user) {
      return false;
    }

    if (!user.isActive) {
      throw new UserInactiveException(request.path);
    }

    if (user.isLocked) {
      throw new UserLockedException(request.path);
    }

    return true;
  }
}
