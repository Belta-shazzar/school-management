/**
 * Integration test helper.
 *
 * Creates the full Express application backed by an in-memory MongoDB instance.
 * Uses the real ManagersLoader pipeline so the test exercises the same code path
 * as production — including middleware auto-wiring, validators, and managers.
 *
 * Usage:
 *   const ctx = await createTestApp();
 *   // make requests: ctx.request.post('/api/user/login').send({ ... })
 *   afterAll(() => ctx.teardown());
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import ManagersLoader from '../../src/loaders/ManagersLoader';
import jwt from 'jsonwebtoken';

// supertest v7+ changed the return type of supertest(app) from SuperTest<Test>
// to TestAgent<Test>. Use ReturnType to stay compatible with whichever version is installed.
type SupertestAgent = ReturnType<typeof supertest>;

export interface TestAppContext {
  /** supertest agent bound to the Express app */
  request: SupertestAgent;
  /** tear down the DB and disconnect mongoose */
  teardown: () => Promise<void>;
  /** generate a signed JWT for a user — pass as the `token` request header */
  makeToken: (payload: { userId: string; role: string; schoolId?: string }) => string;
}

export async function createTestApp(): Promise<TestAppContext> {
  // 1. Start in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // 2. Connect mongoose to the memory server
  await mongoose.connect(uri);

  // 3. Build a minimal test config — matches the Config interface shape
  const testConfig = {
    dotEnv: {
      SERVICE_NAME: 'school-management-test',
      ENV: 'test',
      MONGO_URI: uri,
      USER_PORT: '8001',
      LONG_TOKEN_SECRET: process.env.LONG_TOKEN_SECRET!,
      SHORT_TOKEN_SECRET: process.env.SHORT_TOKEN_SECRET!,
    },
  };

  // 4. Create the full manager stack (validators, models, middlewares, entity managers)
  const managersLoader = new ManagersLoader({ config: testConfig });
  const managers = managersLoader.load();

  // 5. Build the Express app (no DB connection, no HTTP listen)
  const app = managers.server.createApp();

  // 6. Wrap in supertest
  const request = supertest(app);

  // Helper: sign a token with the test secret
  const makeToken = (payload: { userId: string; role: string; schoolId?: string }): string =>
    jwt.sign(payload, process.env.LONG_TOKEN_SECRET!, { expiresIn: '1h' });

  const teardown = async () => {
    // Clear all collections so each test file starts clean
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoose.disconnect();
    await mongod.stop();
  };

  return { request, teardown, makeToken };
}
