import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { getAppConfig } from '../config/app.config';

async function resetDatabase() {
  const { nodeEnv } = getAppConfig();
  if (nodeEnv === 'production') {
    console.error('Database reset is not allowed in production');
    process.exit(1);
  }

  const config = getDatabaseConfig();
  const dataSource = new DataSource({
    ...config,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = dataSource.createQueryRunner();

    // Drop schema
    console.log(`Dropping schema: ${config.schema}`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS ${config.schema} CASCADE`);

    // Recreate schema
    console.log(`Creating schema: ${config.schema}`);
    await queryRunner.query(`CREATE SCHEMA ${config.schema}`);

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
