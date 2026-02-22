/**
 * Integration tests for Classroom endpoints.
 *
 * Uses the real Express app + in-memory MongoDB.
 */

import { createTestApp, TestAppContext } from '../helpers/createTestApp';
import mongoose from 'mongoose';

describe('Classroom API — Integration', () => {
  let ctx: TestAppContext;
  let superAdminToken: string;
  let schoolAdminToken: string;
  let schoolId: string;

  beforeAll(async () => {
    ctx = await createTestApp();

    // Register superadmin
    const superRes = await ctx.request.post('/api/auth/register').send({
      username: 'crsuper',
      email: 'crsuper@example.com',
      password: 'Password1!',
      role: 'superadmin',
    });
    superAdminToken = superRes.body.data.longToken;

    // Create a school to use throughout
    const schoolRes = await ctx.request
      .post('/api/school/createSchool')
      .set('token', superAdminToken)
      .send({ name: 'Classroom Test School', address: '5 Class Ave' });
    schoolId = schoolRes.body.data._id;

    // Register a school_admin and assign them to the school via token
    const adminRes = await ctx.request.post('/api/auth/register').send({
      username: 'cradmin',
      email: 'cradmin@example.com',
      password: 'Password1!',
      role: 'school_admin',
    });
    // Use makeToken to create a token pre-assigned to the school
    schoolAdminToken = ctx.makeToken({
      userId: adminRes.body.data.user._id,
      role: 'school_admin',
      schoolId,
    });
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  // ──────────────────────────────── POST /api/classroom/createClassroom ─────
  describe('POST /api/classroom/createClassroom', () => {
    it('creates a classroom as school_admin (uses token schoolId)', async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', schoolAdminToken)
        .send({ name: 'Class A', capacity: 25 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('Class A');
      expect(res.body.data.capacity).toBe(25);
    });

    it('creates a classroom as superadmin with explicit schoolId', async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', superAdminToken)
        .send({ name: 'Class B', capacity: 30, schoolId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('Class B');
    });

    it('returns 400 when superadmin provides no schoolId', async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', superAdminToken)
        .send({ name: 'Class C', capacity: 20 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('returns 401 without a token', async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .send({ name: 'No Auth', capacity: 10, schoolId });

      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────── GET /api/classroom/getClassroom ─────────
  describe('GET /api/classroom/getClassroom', () => {
    let classroomId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', schoolAdminToken)
        .send({ name: 'Class For Get', capacity: 20 });
      classroomId = res.body.data._id;
    });

    it('returns the classroom for school_admin within their school', async () => {
      const res = await ctx.request
        .get('/api/classroom/getClassroom')
        .set('token', schoolAdminToken)
        .query({ id: classroomId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data._id).toBe(classroomId);
    });

    it('returns the classroom for superadmin', async () => {
      const res = await ctx.request
        .get('/api/classroom/getClassroom')
        .set('token', superAdminToken)
        .query({ id: classroomId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .get('/api/classroom/getClassroom')
        .set('token', schoolAdminToken);

      expect(res.status).toBe(400);
    });

    it('returns 400 for a non-existent classroom', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .get('/api/classroom/getClassroom')
        .set('token', superAdminToken)
        .query({ id: nonExistentId });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────── GET /api/classroom/getClassrooms ────────
  describe('GET /api/classroom/getClassrooms', () => {
    it('returns paginated classrooms scoped to school for school_admin', async () => {
      const res = await ctx.request
        .get('/api/classroom/getClassrooms')
        .set('token', schoolAdminToken)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.classrooms)).toBe(true);
      // All returned classrooms should belong to the admin's school
      res.body.data.classrooms.forEach((c: any) => {
        expect(c.schoolId.toString()).toBe(schoolId);
      });
    });

    it('superadmin can filter by schoolId', async () => {
      const res = await ctx.request
        .get('/api/classroom/getClassrooms')
        .set('token', superAdminToken)
        .query({ schoolId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.classrooms)).toBe(true);
    });
  });

  // ──────────────────────────────── PUT /api/classroom/updateClassroom ──────
  describe('PUT /api/classroom/updateClassroom', () => {
    let classroomId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', schoolAdminToken)
        .send({ name: 'Class To Update', capacity: 20 });
      classroomId = res.body.data._id;
    });

    it('updates the classroom as school_admin', async () => {
      const res = await ctx.request
        .put('/api/classroom/updateClassroom')
        .set('token', schoolAdminToken)
        .send({ id: classroomId, name: 'Class Updated', capacity: 35 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('Class Updated');
      expect(res.body.data.capacity).toBe(35);
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .put('/api/classroom/updateClassroom')
        .set('token', schoolAdminToken)
        .send({ name: 'No ID' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────── DELETE /api/classroom/deleteClassroom ───
  describe('DELETE /api/classroom/deleteClassroom', () => {
    let classroomId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', schoolAdminToken)
        .send({ name: 'Class To Delete', capacity: 15 });
      classroomId = res.body.data._id;
    });

    it('deletes the classroom and returns success', async () => {
      const res = await ctx.request
        .delete('/api/classroom/deleteClassroom')
        .set('token', schoolAdminToken)
        .send({ id: classroomId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toMatch(/deleted/i);
    });

    it('returns 400 when trying to delete a non-existent classroom', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .delete('/api/classroom/deleteClassroom')
        .set('token', superAdminToken)
        .send({ id: nonExistentId });

      expect(res.status).toBe(400);
    });
  });
});
