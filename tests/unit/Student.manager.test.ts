/**
 * Unit tests for StudentManager.
 *
 * All MongoDB model calls are mocked — no database required.
 */

import StudentManager from '../../src/managers/entities/student/Student.manager';

// ─── Mock Mongoose models ────────────────────────────────────────────────────
jest.mock('../../src/managers/entities/student/Student.mongoModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../src/managers/entities/classroom/Classroom.mongoModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

const getMockStudent = (): any =>
  (jest.requireMock('../../src/managers/entities/student/Student.mongoModel') as any).default;

const getMockClassroom = (): any =>
  (jest.requireMock('../../src/managers/entities/classroom/Classroom.mongoModel') as any).default;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeValidators = () => ({
  student: {
    createStudent: jest.fn().mockResolvedValue(null),
    updateStudent: jest.fn().mockResolvedValue(null),
  },
});

const makeManager = (overrides: Record<string, any> = {}) =>
  new StudentManager({ validators: makeValidators(), ...overrides });

const superToken = { role: 'superadmin', userId: 'admin1', schoolId: undefined };
const adminToken = { role: 'school_admin', userId: 'admin2', schoolId: 'school1' };

const fakeStudent = {
  _id: 'student1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  schoolId: { toString: () => 'school1' },
  classroomId: null,
  enrollmentDate: new Date(),
};

const fakeClassroom = {
  _id: 'classroom1',
  schoolId: { toString: () => 'school1' },
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('StudentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────── createStudent ───────────────────────────
  describe('createStudent()', () => {
    it('creates a student for a school_admin using their assigned school', async () => {
      getMockStudent().create.mockResolvedValue(fakeStudent);

      const manager = makeManager();
      const result: any = await manager.createStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        firstName: 'Alice',
        lastName: 'Smith',
      });

      expect(result.firstName).toBe('Alice');
      expect(getMockStudent().create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Alice', schoolId: 'school1' }),
      );
    });

    it('creates a student for a superadmin using explicit schoolId', async () => {
      getMockStudent().create.mockResolvedValue(fakeStudent);

      const manager = makeManager();
      const result: any = await manager.createStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        firstName: 'Alice',
        lastName: 'Smith',
        schoolId: 'school1',
      });

      expect(result.firstName).toBe('Alice');
    });

    it('returns error when superadmin provides no schoolId', async () => {
      const manager = makeManager();
      const result: any = await manager.createStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        firstName: 'Alice',
        lastName: 'Smith',
      });

      expect(result.error).toMatch(/school id is required/i);
      expect(getMockStudent().create).not.toHaveBeenCalled();
    });

    it('validates classroom belongs to the school when classroomId is provided', async () => {
      getMockClassroom().findById.mockResolvedValue(fakeClassroom);
      getMockStudent().create.mockResolvedValue(fakeStudent);

      const manager = makeManager();
      const result: any = await manager.createStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        firstName: 'Alice',
        lastName: 'Smith',
        classroomId: 'classroom1',
      });

      expect(result.firstName).toBe('Alice');
    });

    it('returns error when classroomId does not belong to the school', async () => {
      const otherClassroom = { _id: 'classroom2', schoolId: { toString: () => 'other-school' } };
      getMockClassroom().findById.mockResolvedValue(otherClassroom);

      const manager = makeManager();
      const result: any = await manager.createStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        firstName: 'Alice',
        lastName: 'Smith',
        classroomId: 'classroom2',
      });

      expect(result.error).toMatch(/invalid classroom/i);
      expect(getMockStudent().create).not.toHaveBeenCalled();
    });

    it('returns validation errors early', async () => {
      const validators = {
        student: {
          createStudent: jest.fn().mockResolvedValue({ errors: ['firstName is required'] }),
          updateStudent: jest.fn().mockResolvedValue(null),
        },
      };
      const manager = makeManager({ validators });
      const result: any = await manager.createStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        firstName: '',
        lastName: 'Smith',
      });

      expect(result.errors).toContain('firstName is required');
      expect(getMockStudent().create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────── getStudent ──────────────────────────────
  describe('getStudent()', () => {
    it('returns the student for a superadmin', async () => {
      const mockPopulate = jest.fn().mockReturnThis();
      const mockFinal = jest.fn().mockResolvedValue(fakeStudent);
      getMockStudent().findById.mockReturnValue({
        populate: mockPopulate.mockReturnValue({ populate: mockFinal }),
      });

      const manager = makeManager();
      const result: any = await manager.getStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        __query: { id: 'student1' },
      });

      expect(result._id).toBe('student1');
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.getStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: {},
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns 403-like error when school_admin accesses another school student', async () => {
      const otherStudent = {
        ...fakeStudent,
        schoolId: { toString: () => 'other-school' },
      };
      const mockPopulate = jest.fn().mockReturnThis();
      const mockFinal = jest.fn().mockResolvedValue(otherStudent);
      getMockStudent().findById.mockReturnValue({
        populate: mockPopulate.mockReturnValue({ populate: mockFinal }),
      });

      const manager = makeManager();
      const result: any = await manager.getStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: { id: 'student2' },
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });

  // ──────────────────────────────── getStudents ─────────────────────────────
  describe('getStudents()', () => {
    const mockPaginatedFind = (docs: any[] = [fakeStudent]) => {
      const chain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(docs),
      };
      getMockStudent().find.mockReturnValue(chain);
      getMockStudent().countDocuments.mockResolvedValue(docs.length);
    };

    it('scopes query to school for school_admin', async () => {
      mockPaginatedFind();

      const manager = makeManager();
      const result: any = await manager.getStudents({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: {},
      });

      expect(getMockStudent().find).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school1' }),
      );
      expect(result.students).toHaveLength(1);
    });

    it('allows filtering by classroomId', async () => {
      mockPaginatedFind();

      const manager = makeManager();
      await manager.getStudents({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: { classroomId: 'classroom1' },
      });

      expect(getMockStudent().find).toHaveBeenCalledWith(
        expect.objectContaining({ currentClassroomId: 'classroom1' }),
      );
    });

    it('superadmin can fetch all students without school filter', async () => {
      mockPaginatedFind([]);

      const manager = makeManager();
      await manager.getStudents({
        __token: superToken,
        __schoolAdmin: superToken,
        __query: {},
      });

      expect(getMockStudent().find).toHaveBeenCalledWith({});
    });
  });

  // ──────────────────────────────── updateStudent ───────────────────────────
  describe('updateStudent()', () => {
    it('updates and returns the student', async () => {
      getMockStudent().findById.mockResolvedValue(fakeStudent);
      const updated = { ...fakeStudent, firstName: 'Alicia' };
      getMockStudent().findByIdAndUpdate.mockResolvedValue(updated);

      const manager = makeManager();
      const result: any = await manager.updateStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        id: 'student1',
        firstName: 'Alicia',
      });

      expect(result.firstName).toBe('Alicia');
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.updateStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        id: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns 403-like error for school_admin updating outside their school', async () => {
      const otherStudent = {
        ...fakeStudent,
        schoolId: { toString: () => 'other-school' },
      };
      getMockStudent().findById.mockResolvedValue(otherStudent);

      const manager = makeManager();
      const result: any = await manager.updateStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        id: 'student2',
        firstName: 'Hacked',
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });

  // ──────────────────────────────── deleteStudent ───────────────────────────
  describe('deleteStudent()', () => {
    it('deletes and returns a success message', async () => {
      getMockStudent().findById.mockResolvedValue(fakeStudent);
      getMockStudent().findByIdAndDelete.mockResolvedValue(fakeStudent);

      const manager = makeManager();
      const result: any = await manager.deleteStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        id: 'student1',
      });

      expect(result.message).toMatch(/deleted/i);
    });

    it('returns 403-like error for school_admin deleting outside their school', async () => {
      const otherStudent = {
        ...fakeStudent,
        schoolId: { toString: () => 'other-school' },
      };
      getMockStudent().findById.mockResolvedValue(otherStudent);

      const manager = makeManager();
      const result: any = await manager.deleteStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        id: 'student2',
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });

  // ──────────────────────────────── transferStudent ─────────────────────────
  describe('transferStudent()', () => {
    it('transfers student to a new classroom within the same school', async () => {
      getMockStudent().findById.mockResolvedValue(fakeStudent);
      getMockClassroom().findById.mockResolvedValue(fakeClassroom);
      const transferred = { ...fakeStudent, classroomId: 'classroom1' };
      const mockPopulate = jest.fn().mockReturnThis();
      const mockFinal = jest.fn().mockResolvedValue(transferred);
      getMockStudent().findByIdAndUpdate.mockReturnValue({
        populate: mockPopulate.mockReturnValue({ populate: mockFinal }),
      });

      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        studentId: 'student1',
        newClassroomId: 'classroom1',
      });

      expect(result.message).toMatch(/transferred/i);
    });

    it('returns error when studentId is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        studentId: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns error when neither newSchoolId nor newClassroomId is provided', async () => {
      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        studentId: 'student1',
      });

      expect(result.error).toMatch(/at least one/i);
    });

    it('prevents school_admin from transferring student to another school', async () => {
      getMockStudent().findById.mockResolvedValue(fakeStudent);

      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        studentId: 'student1',
        newSchoolId: 'other-school',
      });

      expect(result.error).toMatch(/forbidden/i);
    });

    it("prevents school_admin from transferring another school's student", async () => {
      const otherStudent = {
        ...fakeStudent,
        schoolId: { toString: () => 'other-school' },
      };
      getMockStudent().findById.mockResolvedValue(otherStudent);

      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: adminToken,
        __schoolAdmin: adminToken,
        studentId: 'student2',
        newClassroomId: 'classroom1',
      });

      expect(result.error).toMatch(/forbidden/i);
    });

    it('returns error when target classroom does not belong to target school', async () => {
      getMockStudent().findById.mockResolvedValue(fakeStudent);
      const wrongClassroom = { _id: 'classroomX', schoolId: { toString: () => 'other-school' } };
      getMockClassroom().findById.mockResolvedValue(wrongClassroom);

      const manager = makeManager();
      const result: any = await manager.transferStudent({
        __token: superToken,
        __schoolAdmin: superToken,
        studentId: 'student1',
        newSchoolId: 'school1',
        newClassroomId: 'classroomX',
      });

      expect(result.error).toMatch(/invalid classroom/i);
    });
  });
});
