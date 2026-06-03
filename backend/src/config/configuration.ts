import { resolve } from 'path';

/**
 * Centralised, typed configuration derived from environment variables.
 * Defaults are dev-friendly; production overrides them via env.
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  databasePath: string;
  seedPassword: string;
  frontendDist: string;
}

export default (): { app: AppConfig } => {
  const databasePath = process.env.DATABASE_PATH || resolve(process.cwd(), '..', 'data', 'app.sqlite');

  return {
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      databasePath,
      seedPassword: process.env.SEED_PASSWORD || 'password123',
      frontendDist: process.env.FRONTEND_DIST || '',
    },
  };
};
