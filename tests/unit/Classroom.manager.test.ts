/**
 * Unit tests for ClassroomManager.
 *
 * All MongoDB model calls are mocked — no database required.
 */

import ClassroomManager from '../../src/managers/entities/classroom/Classroom.manager';

// ─── Mock the Mongoose model ─────────────────────────────────────────────────
jest.mock('../../src/managers/entities/classroom/Classroom.mongoModel', () => ({
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

const getMock = (): any =>
  (jest.requireMock('../../src/managers/entities/classroom/Classroom.mongoModel') as any).default;

// ─── Mock SchoolManager (used in createClassroom to validate school exists) ──
jest.mock('../../src/managers/entities/school/School.manager', () => ({
  __esModule: true,
  default: {
    getSchoolById: jest.fn(),
  },
}));

const getSchoolMock = (): any =>
  (jest.requireMock('../../src/managers/entities/school/School.manager') as any).default;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeValidators = () => ({
  classroom: {
    createClassroom: jest.fn().mockResolvedValue(null),
    updateClassroom: jest.fn().mockResolvedValue(null),
  },
});

const makeManager = (overrides: Record<string, any> = {}) =>
  new ClassroomManager({ validators: makeValidators(), ...overrides });

const superToken = { role: 'superadmin', userId: 'admin1', schoolId: undefined };
const adminToken = { role: 'school_admin', userId: 'admin2', schoolId: 'school1' };

const fakeClassroom = {
  _id: 'classroom1',
  name: 'Class 3B',
  schoolId: { toString: () => 'school1' },
  capacity: 30,
  resources: ['projector'],
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('ClassroomManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────── createClassroom ─────────────────────────
  describe('createClassroom()', () => {
    it('creates a classroom for a school_admin using their assigned school', async () => {
      getSchoolMock().getSchoolById.mockResolvedValue({ _id: 'school1', name: 'Test School' });
      getMock().create.mockResolvedValue(fakeClassroom);

      const manager = makeManager();
      const result: any = await manager.createClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        name: 'Class 3B',
        capacity: 30,
      });

      expect(result.name).toBe('Class 3B');
      expect(getMock().create).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school1', name: 'Class 3B', capacity: 30 }),
      );
    });

    it('creates a classroom for a superadmin using an explicit schoolId', async () => {
      getSchoolMock().getSchoolById.mockResolvedValue({ _id: 'school1', name: 'Test School' });
      getMock().create.mockResolvedValue(fakeClassroom);

      const manager = makeManager();
      const result: any = await manager.createClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        name: 'Class 3B',
        capacity: 30,
        schoolId: 'school1',
      });

      expect(result.name).toBe('Class 3B');
      expect(getMock().create).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school1' }),
      );
    });

    it('returns error when superadmin provides no schoolId', async () => {
      const manager = makeManager();
      const result: any = await manager.createClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        name: 'Class X',
        capacity: 20,
      });

      expect(result.error).toMatch(/school id is required/i);
      expect(getMock().create).not.toHaveBeenCalled();
    });

    it('returns validation errors early', async () => {
      const validators = {
        classroom: {
          createClassroom: jest.fn().mockResolvedValue({ errors: ['name is required'] }),
          updateClassroom: jest.fn().mockResolvedValue(null),
        },
      };
      const manager = makeManager({ validators });
      const result: any = await manager.createClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        name: '',
        capacity: 30,
      });

      expect(result.errors).toContain('name is required');
      expect(getMock().create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────── getClassroom ────────────────────────────
  describe('getClassroom()', () => {
    it('returns the classroom for a superadmin', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(fakeClassroom);
      getMock().findById.mockReturnValue({ populate: mockPopulate });

      const manager = makeManager();
      const result: any = await manager.getClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        __query: { id: 'classroom1' },
      });

      expect(result._id).toBe('classroom1');
    });

    it('returns the classroom for a school_admin within their school', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(fakeClassroom);
      getMock().findById.mockReturnValue({ populate: mockPopulate });

      const manager = makeManager();
      const result: any = await manager.getClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: { id: 'classroom1' },
      });

      expect(result._id).toBe('classroom1');
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.getClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: {},
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns 403-like error when school_admin accesses another school classroom', async () => {
      const otherClassroom = {
        ...fakeClassroom,
        schoolId: { toString: () => 'other-school' },
      };
      const mockPopulate = jest.fn().mockResolvedValue(otherClassroom);
      getMock().findById.mockReturnValue({ populate: mockPopulate });

      const manager = makeManager();
      const result: any = await manager.getClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: { id: 'classroom2' },
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });

  // ──────────────────────────────── getClassrooms ───────────────────────────
  describe('getClassrooms()', () => {
    const mockPaginatedFind = (docs: any[] = [fakeClassroom]) => {
      const chain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(docs),
      };
      getMock().find.mockReturnValue(chain);
      getMock().countDocuments.mockResolvedValue(docs.length);
    };

    it('scopes query to school for school_admin', async () => {
      mockPaginatedFind();

      const manager = makeManager();
      const result: any = await manager.getClassrooms({
        __token: adminToken,
        __schoolAdmin: adminToken,
        __query: {},
      });

      expect(getMock().find).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school1' }),
      );
      expect(result.classrooms).toHaveLength(1);
    });

    it('allows superadmin to filter by schoolId', async () => {
      mockPaginatedFind();

      const manager = makeManager();
      await manager.getClassrooms({
        __token: superToken,
        __schoolAdmin: superToken,
        __query: { schoolId: 'school1' },
      });

      expect(getMock().find).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school1' }),
      );
    });

    it('allows superadmin to fetch all classrooms with no filter', async () => {
      mockPaginatedFind([]);

      const manager = makeManager();
      await manager.getClassrooms({
        __token: superToken,
        __schoolAdmin: superToken,
        __query: {},
      });

      expect(getMock().find).toHaveBeenCalledWith({});
    });
  });

  // ──────────────────────────────── updateClassroom ─────────────────────────
  describe('updateClassroom()', () => {
    it('updates and returns the classroom', async () => {
      getMock().findById.mockResolvedValue(fakeClassroom);
      const updated = { ...fakeClassroom, name: 'Class Updated' };
      getMock().findByIdAndUpdate.mockResolvedValue(updated);

      const manager = makeManager();
      const result: any = await manager.updateClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        id: 'classroom1',
        name: 'Class Updated',
      });

      expect(result.name).toBe('Class Updated');
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.updateClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        id: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns 403-like error when school_admin updates another school classroom', async () => {
      const otherClassroom = {
        ...fakeClassroom,
        schoolId: { toString: () => 'other-school' },
      };
      getMock().findById.mockResolvedValue(otherClassroom);

      const manager = makeManager();
      const result: any = await manager.updateClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        id: 'classroom2',
        name: 'Hacked',
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });

  // ──────────────────────────────── deleteClassroom ─────────────────────────
  describe('deleteClassroom()', () => {
    it('deletes and returns a success message', async () => {
      getMock().findById.mockResolvedValue(fakeClassroom);
      getMock().findByIdAndDelete.mockResolvedValue(fakeClassroom);

      const manager = makeManager();
      const result: any = await manager.deleteClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        id: 'classroom1',
      });

      expect(result.message).toMatch(/deleted/i);
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.deleteClassroom({
        __token: superToken,
        __schoolAdmin: superToken,
        id: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns 403-like error for school_admin deleting outside their school', async () => {
      const otherClassroom = {
        ...fakeClassroom,
        schoolId: { toString: () => 'other-school' },
      };
      getMock().findById.mockResolvedValue(otherClassroom);

      const manager = makeManager();
      const result: any = await manager.deleteClassroom({
        __token: adminToken,
        __schoolAdmin: adminToken,
        id: 'classroom2',
      });

      expect(result.error).toMatch(/forbidden/i);
    });
  });
});
