import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAssignment = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data === 'id') {
      return user?.activeUserDepartmentRoleId;
    }
    if (data === 'roleId') {
      return user?.activeRoleCode;
    }

    return {
      id: user?.activeUserDepartmentRoleId,
      roleId: user?.activeRoleCode,
    };
  },
);
