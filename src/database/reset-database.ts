import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

async function resetDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', '9203106'),
    database: configService.get('DB_DATABASE', 'cps_database'),
    schema: configService.get('DB_SCHEMA', 'iam'),
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = dataSource.createQueryRunner();

    // Drop schema
    console.log(`Dropping schema: ${configService.get('DB_SCHEMA', 'iam')}`);
    await queryRunner.query(
      `DROP SCHEMA IF EXISTS ${configService.get('DB_SCHEMA', 'iam')} CASCADE`,
    );

    // Recreate schema
    console.log(`Creating schema: ${configService.get('DB_SCHEMA', 'iam')}`);
    await queryRunner.query(
      `CREATE SCHEMA ${configService.get('DB_SCHEMA', 'iam')}`,
    );

    await queryRunner.release();
    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

resetDatabase();
