import 'dotenv/config';

type Env = {
  NODE_ENV: string; nodeEnv: string;
  PORT: number; port: number;
  MONGODB_URI: string; mongoUri: string;
  JWT_SECRET: string; JWT_EXPIRES_IN: string;
  ALLOWED_ORIGINS: string[]; allowedOrigins: string[];
  CORS_ORIGINS: string[]; corsOrigins: string[];
};

const list = (s?: string) =>
  (s ?? '').split(',').map(v => v.trim()).filter(Boolean);

const ALLOWED = list(process.env.ALLOWED_ORIGINS);
const CORS = list(process.env.CORS_ORIGINS);

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  nodeEnv: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  port: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  mongoUri: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  ALLOWED_ORIGINS: ALLOWED,
  allowedOrigins: ALLOWED,
  CORS_ORIGINS: [...CORS, ...ALLOWED],
  corsOrigins: [...CORS, ...ALLOWED],
};

export default env;
