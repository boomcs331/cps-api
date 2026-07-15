import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserWithAssignment } from '../interfaces/current-user.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserWithAssignment | undefined,
    ctx: ExecutionContext,
  ): CurrentUserWithAssignment | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserWithAssignment;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
