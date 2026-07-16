import { registerAs } from '@nestjs/config';
import { getEnv, getEnvNumber } from './env.utils';

export const APP_CONFIG_TOKEN = 'app';

export const getAppConfig = () => ({
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3001),
  corsOrigin: getEnv('CORS_ORIGIN', ''),
});

export const appConfig = registerAs(APP_CONFIG_TOKEN, getAppConfig);
