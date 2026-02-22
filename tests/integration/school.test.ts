/**
 * Integration tests for School endpoints.
 *
 * Uses the real Express app + in-memory MongoDB.
 */

import { createTestApp, TestAppContext } from '../helpers/createTestApp';
import mongoose from 'mongoose';

describe('School API — Integration', () => {
  let ctx: TestAppContext;
  let superAdminToken: string;
  let schoolAdminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();

    // Create users and capture their tokens
    const superRes = await ctx.request.post('/api/auth/register').send({
      username: 'schoolsuper',
      email: 'schoolsuper@example.com',
      password: 'Password1!',
      role: 'superadmin',
    });
    superAdminToken = superRes.body.data.longToken;

    const adminRes = await ctx.request.post('/api/auth/register').send({
      username: 'schooladmin',
      email: 'schooladmin@example.com',
      password: 'Password1!',
      role: 'school_admin',
    });
    schoolAdminToken = adminRes.body.data.longToken;
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  // ──────────────────────────────── POST /api/school/createSchool ───────────
  describe('POST /api/school/createSchool', () => {
    it('creates a school when authenticated as superadmin', async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', superAdminToken)
        .send({
          name: 'Integration Test School',
          address: '1 Test Avenue, Testville',
          phone: '555-0100',
          email: 'info@testschool.com',
          website: 'https://testschool.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('Integration Test School');
      expect(res.body.data._id).toBeDefined();
    });

    it('returns 403 when school_admin tries to create a school', async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', schoolAdminToken)
        .send({
          name: 'Unauthorized School',
          address: '2 Test Lane',
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    it('returns 401 when no token is provided', async () => {
      const res = await ctx.request.post('/api/school/createSchool').send({
        name: 'No Auth School',
        address: '3 Anon Street',
      });

      expect(res.status).toBe(401);
    });

    it('returns 400 when school name already exists', async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', superAdminToken)
        .send({
          name: 'Integration Test School', // same name as above
          address: 'Duplicate Ave',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ──────────────────────────────── GET /api/school/getSchool ──────────────
  describe('GET /api/school/getSchool', () => {
    let schoolId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', superAdminToken)
        .send({ name: 'School For Get Test', address: '10 Get Lane' });
      schoolId = res.body.data._id;
    });

    it('returns the school by ID for superadmin', async () => {
      const res = await ctx.request
        .get('/api/school/getSchool')
        .set('token', superAdminToken)
        .query({ id: schoolId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data._id).toBe(schoolId);
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .get('/api/school/getSchool')
        .set('token', superAdminToken);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('returns 400 for a non-existent school ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .get('/api/school/getSchool')
        .set('token', superAdminToken)
        .query({ id: nonExistentId });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('returns 403 for school_admin', async () => {
      const res = await ctx.request
        .get('/api/school/getSchool')
        .set('token', schoolAdminToken)
        .query({ id: schoolId });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────── GET /api/school/getSchools ─────────────
  describe('GET /api/school/getSchools', () => {
    it('returns paginated school list for superadmin', async () => {
      const res = await ctx.request
        .get('/api/school/getSchools')
        .set('token', superAdminToken)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.schools)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(10);
    });

    it('returns 403 for school_admin', async () => {
      const res = await ctx.request
        .get('/api/school/getSchools')
        .set('token', schoolAdminToken);

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────── PUT /api/school/updateSchool ───────────
  describe('PUT /api/school/updateSchool', () => {
    let schoolId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', superAdminToken)
        .send({ name: 'School To Update', address: '20 Update Blvd' });
      schoolId = res.body.data._id;
    });

    it('updates the school and returns the updated document', async () => {
      const res = await ctx.request
        .put('/api/school/updateSchool')
        .set('token', superAdminToken)
        .send({ id: schoolId, name: 'School Updated', phone: '555-9999' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('School Updated');
      expect(res.body.data.phone).toBe('555-9999');
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .put('/api/school/updateSchool')
        .set('token', superAdminToken)
        .send({ name: 'No ID School' });

      expect(res.status).toBe(400);
    });

    it('returns 403 for school_admin', async () => {
      const res = await ctx.request
        .put('/api/school/updateSchool')
        .set('token', schoolAdminToken)
        .send({ id: schoolId, name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────── DELETE /api/school/deleteSchool ─────────
  describe('DELETE /api/school/deleteSchool', () => {
    let schoolId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/school/createSchool')
        .set('token', superAdminToken)
        .send({ name: 'School To Delete', address: '30 Delete Road' });
      schoolId = res.body.data._id;
    });

    it('deletes the school and returns a success message', async () => {
      const res = await ctx.request
        .delete('/api/school/deleteSchool')
        .set('token', superAdminToken)
        .send({ id: schoolId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toMatch(/deleted/i);
    });

    it('returns 400 when deleting a non-existent school', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .delete('/api/school/deleteSchool')
        .set('token', superAdminToken)
        .send({ id: nonExistentId });

      expect(res.status).toBe(400);
    });

    it('returns 403 for school_admin', async () => {
      const res = await ctx.request
        .delete('/api/school/deleteSchool')
        .set('token', schoolAdminToken)
        .send({ id: schoolId });

      expect(res.status).toBe(403);
    });
  });
});
