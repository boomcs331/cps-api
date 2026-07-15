import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionEffect1700000000002 implements MigrationInterface {
  name = 'AddPermissionEffect1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE iam.user_department_permissions
      ADD COLUMN IF NOT EXISTS effect VARCHAR(10) NOT NULL DEFAULT 'ALLOW'
    `);
    await queryRunner.query(`
      ALTER TABLE iam.user_department_permissions
      ADD CONSTRAINT user_department_permissions_effect_check
      CHECK (effect IN ('ALLOW', 'DENY'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE iam.user_department_permissions
      DROP CONSTRAINT IF EXISTS user_department_permissions_effect_check
    `);
    await queryRunner.query(`
      ALTER TABLE iam.user_department_permissions
      DROP COLUMN IF EXISTS effect
    `);
  }
}
