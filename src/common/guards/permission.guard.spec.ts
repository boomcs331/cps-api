import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const context = (user: any) => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user, path: '/users' }) }),
  }) as unknown as ExecutionContext;

  it('allows a user with every required permission', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['user.create']) } as unknown as Reflector;
    const service = { getEffectivePermissionCodes: jest.fn().mockResolvedValue(['user.create']) } as any;
    const guard = new PermissionGuard(reflector, service);

    await expect(guard.canActivate(context({ id: '1', activeRoleCode: 'USER', activeUserDepartmentRoleId: '2' }))).resolves.toBe(true);
  });

  it('denies a user without the required permission', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['user.delete']) } as unknown as Reflector;
    const service = { getEffectivePermissionCodes: jest.fn().mockResolvedValue(['user.view']) } as any;
    const guard = new PermissionGuard(reflector, service);

    await expect(guard.canActivate(context({ id: '1', activeRoleCode: 'USER', activeUserDepartmentRoleId: '2' }))).rejects.toMatchObject({ response: { code: 'PERMISSION_DENIED' } });
  });
});
