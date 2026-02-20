import dotenv from 'dotenv';
import path from 'path';
import { slugify } from '../libs/utils';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pjson = require('../../package.json');

const SERVICE_NAME = process.env.SERVICE_NAME ? slugify(process.env.SERVICE_NAME) : pjson.name;
const SERVICE_PORT = process.env.SERVICE_PORT || '8000';
// const ADMIN_PORT = process.env.ADMIN_PORT || '5222';
// const ADMIN_URL = process.env.ADMIN_URL || `http://localhost:${ADMIN_PORT}`;
const ENV = process.env.SERVICE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;
const LONG_TOKEN_SECRET = process.env.LONG_TOKEN_SECRET || null;
const SHORT_TOKEN_SECRET = process.env.SHORT_TOKEN_SECRET || null;
const NACL_SECRET = process.env.NACL_SECRET || null;

if (!LONG_TOKEN_SECRET || !SHORT_TOKEN_SECRET || !NACL_SECRET) {
  throw new Error('missing .env variables check index.config');
}

export interface DotEnv {
  SERVICE_NAME: string;
  ENV: string;
  MONGO_URI: string;
  USER_PORT: string;
  // ADMIN_PORT: string;
  // ADMIN_URL: string;
  LONG_TOKEN_SECRET: string;
  SHORT_TOKEN_SECRET: string;
}

export interface Config {
  dotEnv: DotEnv;
}

const config: Config = {
  dotEnv: {
    SERVICE_NAME,
    ENV,
    MONGO_URI,
    USER_PORT: SERVICE_PORT,
    // ADMIN_PORT,
    // ADMIN_URL,
    LONG_TOKEN_SECRET,
    SHORT_TOKEN_SECRET,
  },
};

export default config;
