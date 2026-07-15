import { EffectivePermissionService } from './effective-permission.service';

describe('EffectivePermissionService', () => {
  it('merges role permissions, applies direct overrides, and removes duplicates', async () => {
    const service = new EffectivePermissionService({
      getEffectivePermissionRows: jest.fn().mockResolvedValue([
        { code: 'user.view', source: 'ROLE', effect: 'ALLOW' },
        { code: 'user.view', source: 'ROLE', effect: 'ALLOW' },
        { code: 'user.create', source: 'ROLE', effect: 'ALLOW' },
        { code: 'user.create', source: 'USER', effect: 'DENY' },
        { code: 'user.update', source: 'USER', effect: 'ALLOW' },
      ]),
    } as any);

    await expect(service.getEffectivePermissionCodes('1')).resolves.toEqual([
      'user.update',
      'user.view',
    ]);
  });

  it('returns every active permission for a super admin', async () => {
    const service = new EffectivePermissionService({
      getAllActivePermissionCodes: jest
        .fn()
        .mockResolvedValue(['user.view', 'menu.view']),
    } as any);

    await expect(
      service.getEffectivePermissionCodes('1', undefined, true),
    ).resolves.toEqual(['menu.view', 'user.view']);
  });
});
