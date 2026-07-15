import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentDepartment = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data === 'id') {
      return user?.activeDepartmentId;
    }
    if (data === 'code') {
      return user?.activeDepartmentCode;
    }
    if (data === 'name') {
      return user?.activeDepartmentName;
    }

    return {
      id: user?.activeDepartmentId,
      code: user?.activeDepartmentCode,
      name: user?.activeDepartmentName,
    };
  },
);
