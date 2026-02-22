/**
 * Integration tests for User endpoints.
 *
 * Uses the real Express app + in-memory MongoDB.
 * Tests the full pipeline: HTTP → middleware chain → manager → database.
 */

import { createTestApp, TestAppContext } from '../helpers/createTestApp';

describe('User API — Integration', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  // ──────────────────────────────── POST /api/auth/register ─────────────────
  describe('POST /api/auth/register', () => {
    const validPayload = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'Password1!',
    };

    it('registers a new user and returns a token', async () => {
      const res = await ctx.request.post('/api/auth/register').send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('testuser@example.com');
      expect(res.body.data.longToken).toBeDefined();
      // password must never be in response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 400 when email is already registered', async () => {
      // register once more with same email
      const res = await ctx.request.post('/api/auth/register').send(validPayload);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('defaults role to school_admin when no role is provided', async () => {
      const res = await ctx.request.post('/api/auth/register').send({
        username: 'newuser2',
        email: 'newuser2@example.com',
        password: 'Password1!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('school_admin');
    });

    it('accepts superadmin role', async () => {
      const res = await ctx.request.post('/api/auth/register').send({
        username: 'superuser',
        email: 'superuser@example.com',
        password: 'Password1!',
        role: 'superadmin',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('superadmin');
    });
  });

  // ──────────────────────────────── POST /api/auth/login ────────────────────
  describe('POST /api/auth/login', () => {
    const credentials = {
      email: 'testuser@example.com',
      password: 'Password1!',
    };

    it('logs in with correct credentials and returns a token', async () => {
      const res = await ctx.request.post('/api/auth/login').send(credentials);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.longToken).toBeDefined();
      expect(res.body.data.user.email).toBe(credentials.email);
    });

    it('returns 400 for wrong password', async () => {
      const res = await ctx.request
        .post('/api/auth/login')
        .send({ email: credentials.email, password: 'WrongPass1!' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('returns 400 for non-existent email', async () => {
      const res = await ctx.request
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password1!' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ──────────────────────────────── Auth guard sanity ───────────────────────
  describe('Protected endpoint — auth guard', () => {
    it('returns 401 when token header is missing', async () => {
      const res = await ctx.request.post('/api/school/createSchool').send({
        name: 'Test School',
        address: '123 Street',
      });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', 'this-is-not-a-valid-jwt')
        .send({ name: 'Test School', address: '123 Street' });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });
  });

  // ──────────────────────────────── Unknown routes ──────────────────────────
  describe('Unknown module/function', () => {
    it('returns 400 for an unknown module', async () => {
      const res = await ctx.request.post('/api/unknown/doSomething').send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('returns 400 for an unknown function on a known module', async () => {
      const res = await ctx.request.post('/api/auth/nonExistentFn').send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });
});
