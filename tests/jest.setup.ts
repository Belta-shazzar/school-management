/**
 * Jest setup file — runs before any module is imported in each test file.
 * Sets the environment variables required by src/config/index.config.ts.
 */

// Suppress Winston log output during tests
process.env.NODE_ENV = 'test';
process.env.SERVICE_ENV = 'test';

// These values are used by config/index.config.ts
process.env.SERVICE_NAME = 'school-management-test';
process.env.SERVICE_PORT = '8001';
process.env.MONGO_URI = 'mongodb://localhost:27017/school-test'; // overridden by memory server in integration tests
process.env.LONG_TOKEN_SECRET = 'test-long-token-secret-minimum-32-characters!!';
process.env.SHORT_TOKEN_SECRET = 'test-short-token-secret-minimum-32-characters!';
process.env.NACL_SECRET = 'test-nacl-secret-32-chars-minimum!';
