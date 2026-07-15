import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../entities/iam/permission.entity';
import { RoleAction } from '../../entities/iam/role-action.entity';
import { UserDepartmentRole } from '../../entities/iam/user-department-role.entity';
import { UserDepartmentPermission } from '../../entities/iam/user-department-permission.entity';
import { Menu } from '../../entities/iam/menu.entity';

export interface EffectivePermissionRow {
  code: string;
  effect: 'ALLOW' | 'DENY';
  source: 'ROLE' | 'USER';
}

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RoleAction)
    private readonly roleActionRepository: Repository<RoleAction>,
    @InjectRepository(UserDepartmentRole)
    private readonly assignmentRepository: Repository<UserDepartmentRole>,
    @InjectRepository(UserDepartmentPermission)
    private readonly directPermissionRepository: Repository<UserDepartmentPermission>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async getAllActivePermissionCodes(): Promise<string[]> {
    const permissions = await this.permissionRepository.find({
      where: { isActive: true },
      select: ['code'],
    });
    return permissions.map((permission) => permission.code);
  }

  async getEffectivePermissionRows(
    userId: string,
    assignmentId?: string,
  ): Promise<EffectivePermissionRow[]> {
    const assignments = await this.assignmentRepository.find({
      where: assignmentId
        ? { id: assignmentId, userId, isActive: true }
        : { userId, isActive: true },
      select: ['id', 'roleId'],
    });
    const roleIds = assignments.map((assignment) => assignment.roleId);
    const roleActions = roleIds.length
      ? await this.roleActionRepository.find({
          where: roleIds.map((roleId) => ({ roleId, isActive: true })),
          relations: ['action'],
        })
      : [];
    const actionIds = [
      ...new Set(roleActions.map((roleAction) => roleAction.actionId)),
    ];
    const rolePermissions = actionIds.length
      ? await this.permissionRepository.find({
          where: actionIds.map((actionId) => ({ actionId, isActive: true })),
          relations: ['action'],
        })
      : [];
    const direct = assignments.length
      ? await this.directPermissionRepository.find({
          where: assignments.map((assignment) => ({
            userDepartmentRoleId: assignment.id,
            isActive: true,
          })),
          relations: ['permission'],
        })
      : [];

    return [
      ...rolePermissions.map((permission) => ({
        code: permission.code,
        effect: 'ALLOW' as const,
        source: 'ROLE' as const,
      })),
      ...direct
        .filter((entry) => entry.permission?.isActive)
        .map((entry) => ({
          code: entry.permission.code,
          effect: entry.effect ?? ('ALLOW' as const),
          source: 'USER' as const,
        })),
    ];
  }

  async getMenusWithPermissions(): Promise<
    Array<Menu & { permissions: string[] }>
  > {
    const [menus, permissions] = await Promise.all([
      this.menuRepository.find({
        where: { isActive: true, isVisible: true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      }),
      this.permissionRepository.find({
        where: { isActive: true },
        relations: ['menu'],
      }),
    ]);
    const permissionMap = new Map<string, string[]>();
    for (const permission of permissions) {
      const codes = permissionMap.get(permission.menuId) ?? [];
      codes.push(permission.code);
      permissionMap.set(permission.menuId, codes);
    }
    return menus.map((menu) => ({
      ...menu,
      permissions: [...new Set(permissionMap.get(menu.id) ?? [])],
    }));
  }
}
