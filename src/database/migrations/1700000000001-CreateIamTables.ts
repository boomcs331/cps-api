import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIamTables1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create actions table
    await queryRunner.query(`
      CREATE TABLE iam.actions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name_th VARCHAR(50) NOT NULL,
        name_en VARCHAR(50) NOT NULL,
        description TEXT,
        sort_order INT DEFAULT 0,
        is_system BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE iam.roles (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name_th VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        scope_type VARCHAR(20) CHECK (scope_type IN ('SYSTEM', 'DEPARTMENT')) DEFAULT 'DEPARTMENT',
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create role_actions table
    await queryRunner.query(`
      CREATE TABLE iam.role_actions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        role_id BIGINT NOT NULL,
        action_id BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES iam.roles(id) ON DELETE CASCADE,
        FOREIGN KEY (action_id) REFERENCES iam.actions(id) ON DELETE CASCADE,
        UNIQUE(role_id, action_id)
      )
    `);

    // Create departments table
    await queryRunner.query(`
      CREATE TABLE iam.departments (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name_th VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE iam.users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        telephone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        is_locked BOOLEAN DEFAULT false,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP,
        last_login_at TIMESTAMP,
        permission_version INT DEFAULT 1,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_department_roles table
    await queryRunner.query(`
      CREATE TABLE iam.user_department_roles (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        department_id BIGINT,
        role_id BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        assigned_at TIMESTAMP,
        assigned_by BIGINT,
        expired_at TIMESTAMP,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES iam.departments(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES iam.roles(id) ON DELETE CASCADE
      )
    `);

    // Create menus table
    await queryRunner.query(`
      CREATE TABLE iam.menus (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        parent_id BIGINT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name_th VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        menu_type VARCHAR(10) CHECK (menu_type IN ('MAIN', 'SUB')) DEFAULT 'MAIN',
        path VARCHAR(255),
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES iam.menus(id) ON DELETE CASCADE
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE iam.permissions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        menu_id BIGINT NOT NULL,
        action_id BIGINT NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_id) REFERENCES iam.menus(id) ON DELETE CASCADE,
        FOREIGN KEY (action_id) REFERENCES iam.actions(id) ON DELETE CASCADE,
        UNIQUE(menu_id, action_id)
      )
    `);

    // Create user_department_permissions table
    await queryRunner.query(`
      CREATE TABLE iam.user_department_permissions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_department_role_id BIGINT NOT NULL,
        permission_id BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        granted_at TIMESTAMP,
        granted_by BIGINT,
        expires_at TIMESTAMP,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_department_role_id) REFERENCES iam.user_department_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES iam.permissions(id) ON DELETE CASCADE
      )
    `);

    // Create auth_sessions table
    await queryRunner.query(`
      CREATE TABLE iam.auth_sessions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        active_user_department_role_id BIGINT,
        refresh_token_hash VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE,
        FOREIGN KEY (active_user_department_role_id) REFERENCES iam.user_department_roles(id) ON DELETE CASCADE
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE iam.audit_logs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        actor_user_id BIGINT,
        department_id BIGINT,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50),
        target_id BIGINT,
        before_data JSONB,
        after_data JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES iam.departments(id) ON DELETE SET NULL
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX idx_user_department_roles_user_id ON iam.user_department_roles(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_department_roles_department_id ON iam.user_department_roles(department_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_department_roles_role_id ON iam.user_department_roles(role_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_department_permissions_user_department_role_id ON iam.user_department_permissions(user_department_role_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_department_permissions_permission_id ON iam.user_department_permissions(permission_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_auth_sessions_user_id ON iam.auth_sessions(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_auth_sessions_active_user_department_role_id ON iam.auth_sessions(active_user_department_role_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_actor_user_id ON iam.audit_logs(actor_user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_department_id ON iam.audit_logs(department_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_action ON iam.audit_logs(action)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_created_at ON iam.audit_logs(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS iam.audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.auth_sessions`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS iam.user_department_permissions`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS iam.permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.menus`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.user_department_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.users`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.departments`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.role_actions`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS iam.actions`);
  }
}
