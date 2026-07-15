import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserDepartmentRole } from './user-department-role.entity';
import { Permission } from './permission.entity';

@Entity('user_department_permissions', { schema: 'iam' })
export class UserDepartmentPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'user_department_role_id', type: 'bigint' })
  userDepartmentRoleId: string;

  @Index()
  @Column({ name: 'permission_id', type: 'bigint' })
  permissionId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'effect', type: 'varchar', length: 10, default: 'ALLOW' })
  effect: 'ALLOW' | 'DENY';

  @Column({ name: 'granted_at', type: 'timestamp', nullable: true })
  grantedAt: Date;

  @Column({ name: 'granted_by', type: 'bigint', nullable: true })
  grantedBy: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => UserDepartmentRole)
  @JoinColumn({ name: 'user_department_role_id' })
  userDepartmentRole: UserDepartmentRole;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
