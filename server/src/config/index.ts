import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS
    ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
    : 10,
};
