import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIamSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema('iam', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropSchema('iam', true);
  }
}
