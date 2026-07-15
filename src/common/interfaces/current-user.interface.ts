import { RoleCode } from '../enums/role-code.enum';

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isLocked: boolean;
  permissionVersion: number;
}

export interface CurrentUserWithAssignment extends CurrentUser {
  sessionId: string;
  activeDepartmentId: string | null;
  activeDepartmentCode: string | null;
  activeDepartmentName: string | null;
  activeRoleCode: RoleCode | null;
  activeUserDepartmentRoleId: string | null;
}
