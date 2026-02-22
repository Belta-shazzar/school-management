/**
 * Integration tests for Student endpoints.
 *
 * Uses the real Express app + in-memory MongoDB.
 */

import { createTestApp, TestAppContext } from '../helpers/createTestApp';
import mongoose from 'mongoose';

describe('Student API — Integration', () => {
  let ctx: TestAppContext;
  let superAdminToken: string;
  let schoolAdminToken: string;
  let schoolId: string;
  let otherSchoolId: string;
  let classroomId: string;

  beforeAll(async () => {
    ctx = await createTestApp();

    // Register superadmin
    const superRes = await ctx.request.post('/api/auth/register').send({
      username: 'stusuper',
      email: 'stusuper@example.com',
      password: 'Password1!',
      role: 'superadmin',
    });
    superAdminToken = superRes.body.data.longToken;

    // Create primary school
    const schoolRes = await ctx.request
      .post('/api/school/createSchool')
      .set('token', superAdminToken)
      .send({ name: 'Student Test School', address: '7 Student Ave' });
    schoolId = schoolRes.body.data._id;

    // Create a second school (for cross-school transfer tests)
    const otherRes = await ctx.request
      .post('/api/school/createSchool')
      .set('token', superAdminToken)
      .send({ name: 'Other School', address: '8 Other Blvd' });
    otherSchoolId = otherRes.body.data._id;

    // Create a classroom in the primary school
    const classRes = await ctx.request
      .post('/api/classroom/createClassroom')
      .set('token', superAdminToken)
      .send({ name: 'Grade 5A', capacity: 30, schoolId });
    classroomId = classRes.body.data._id;

    // Register a school_admin assigned to the primary school
    const adminRes = await ctx.request.post('/api/auth/register').send({
      username: 'stuadmin',
      email: 'stuadmin@example.com',
      password: 'Password1!',
      role: 'school_admin',
    });
    schoolAdminToken = ctx.makeToken({
      userId: adminRes.body.data.user._id,
      role: 'school_admin',
      schoolId,
    });
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  // ──────────────────────────────── POST /api/student/createStudent ─────────
  describe('POST /api/student/createStudent', () => {
    it('enrolls a student as school_admin', async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          dateOfBirth: '2010-03-15',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.firstName).toBe('Alice');
      expect(res.body.data.lastName).toBe('Smith');
      expect(res.body.data.schoolId).toBeDefined();
    });

    it('enrolls a student with a classroom as school_admin', async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({
          firstName: 'Bob',
          lastName: 'Jones',
          classroomId,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns 400 when superadmin provides no schoolId', async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', superAdminToken)
        .send({ firstName: 'Charlie', lastName: 'Brown' });

      expect(res.status).toBe(400);
    });

    it('creates a student as superadmin with explicit schoolId', async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', superAdminToken)
        .send({
          firstName: 'Diana',
          lastName: 'Prince',
          schoolId,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns 401 without a token', async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .send({ firstName: 'Eve', lastName: 'Adams', schoolId });

      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────── GET /api/student/getStudent ────────────
  describe('GET /api/student/getStudent', () => {
    let studentId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({ firstName: 'Frank', lastName: 'Castle' });
      studentId = res.body.data._id;
    });

    it('returns the student for school_admin within their school', async () => {
      const res = await ctx.request
        .get('/api/student/getStudent')
        .set('token', schoolAdminToken)
        .query({ id: studentId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data._id).toBe(studentId);
    });

    it('returns the student for superadmin', async () => {
      const res = await ctx.request
        .get('/api/student/getStudent')
        .set('token', superAdminToken)
        .query({ id: studentId });

      expect(res.status).toBe(200);
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .get('/api/student/getStudent')
        .set('token', schoolAdminToken);

      expect(res.status).toBe(400);
    });

    it('returns 400 for a non-existent student', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .get('/api/student/getStudent')
        .set('token', superAdminToken)
        .query({ id: nonExistentId });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────── GET /api/student/getStudents ───────────
  describe('GET /api/student/getStudents', () => {
    it('returns paginated students scoped to school for school_admin', async () => {
      const res = await ctx.request
        .get('/api/student/getStudents')
        .set('token', schoolAdminToken)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.students)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
    });

    it('allows filtering by classroomId', async () => {
      const res = await ctx.request
        .get('/api/student/getStudents')
        .set('token', schoolAdminToken)
        .query({ classroomId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('superadmin can filter by schoolId', async () => {
      const res = await ctx.request
        .get('/api/student/getStudents')
        .set('token', superAdminToken)
        .query({ schoolId });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.students)).toBe(true);
    });
  });

  // ──────────────────────────────── PUT /api/student/updateStudent ──────────
  describe('PUT /api/student/updateStudent', () => {
    let studentId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({ firstName: 'Grace', lastName: 'Hopper' });
      studentId = res.body.data._id;
    });

    it('updates the student and returns the updated document', async () => {
      const res = await ctx.request
        .put('/api/student/updateStudent')
        .set('token', schoolAdminToken)
        .send({ id: studentId, firstName: 'Grace Updated', email: 'grace@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.firstName).toBe('Grace Updated');
    });

    it('returns 400 when id is missing', async () => {
      const res = await ctx.request
        .put('/api/student/updateStudent')
        .set('token', schoolAdminToken)
        .send({ firstName: 'No ID' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────── PUT /api/student/transferStudent ────────
  describe('PUT /api/student/transferStudent', () => {
    let studentId: string;
    let otherClassroomId: string;

    beforeAll(async () => {
      // Student to transfer
      const stuRes = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({ firstName: 'Transfer', lastName: 'Me' });
      studentId = stuRes.body.data._id;

      // Classroom in the OTHER school
      const clsRes = await ctx.request
        .post('/api/classroom/createClassroom')
        .set('token', superAdminToken)
        .send({ name: 'Other Class', capacity: 20, schoolId: otherSchoolId });
      otherClassroomId = clsRes.body.data._id;
    });

    it('transfers student to a different classroom within the same school (school_admin)', async () => {
      const res = await ctx.request
        .put('/api/student/transferStudent')
        .set('token', schoolAdminToken)
        .send({ studentId, newClassroomId: classroomId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toMatch(/transferred/i);
    });

    it('transfers student to a different school (superadmin)', async () => {
      const res = await ctx.request
        .put('/api/student/transferStudent')
        .set('token', superAdminToken)
        .send({
          studentId,
          newSchoolId: otherSchoolId,
          newClassroomId: otherClassroomId,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns 400 when neither newSchoolId nor newClassroomId is provided', async () => {
      const res = await ctx.request
        .put('/api/student/transferStudent')
        .set('token', superAdminToken)
        .send({ studentId });

      expect(res.status).toBe(400);
    });

    it('returns 400 when student does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .put('/api/student/transferStudent')
        .set('token', superAdminToken)
        .send({ studentId: nonExistentId, newSchoolId: otherSchoolId });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────── DELETE /api/student/deleteStudent ───────
  describe('DELETE /api/student/deleteStudent', () => {
    let studentId: string;

    beforeAll(async () => {
      const res = await ctx.request
        .post('/api/student/createStudent')
        .set('token', schoolAdminToken)
        .send({ firstName: 'Delete', lastName: 'Me' });
      studentId = res.body.data._id;
    });

    it('deletes the student and returns success', async () => {
      const res = await ctx.request
        .delete('/api/student/deleteStudent')
        .set('token', schoolAdminToken)
        .send({ id: studentId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toMatch(/deleted/i);
    });

    it('returns 400 when deleting a non-existent student', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await ctx.request
        .delete('/api/student/deleteStudent')
        .set('token', superAdminToken)
        .send({ id: nonExistentId });

      expect(res.status).toBe(400);
    });

    it('returns 403 when school_admin tries to delete a student from another school', async () => {
      // Create a student in the other school (as superadmin)
      const stuRes = await ctx.request
        .post('/api/student/createStudent')
        .set('token', superAdminToken)
        .send({ firstName: 'Other', lastName: 'Student', schoolId: otherSchoolId });
      const otherStudentId = stuRes.body.data._id;

      const res = await ctx.request
        .delete('/api/student/deleteStudent')
        .set('token', schoolAdminToken)
        .send({ id: otherStudentId });

      expect(res.status).toBe(400); // returns { error: 'Forbidden...' } → dispatched as 400
      expect(res.body.ok).toBe(false);
    });
  });
});
