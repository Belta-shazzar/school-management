/**
 * Unit tests for SchoolManager.
 *
 * All MongoDB model calls are mocked — no database required.
 */

import SchoolManager from '../../src/managers/entities/school/School.manager';

// ─── Mock the Mongoose model ─────────────────────────────────────────────────
jest.mock('../../src/managers/entities/school/School.mongoModel', () => ({
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
  (jest.requireMock('../../src/managers/entities/school/School.mongoModel') as any).default;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeValidators = () => ({
  school: {
    createSchool: jest.fn().mockResolvedValue(null),
    updateSchool: jest.fn().mockResolvedValue(null),
  },
});

const makeManager = (overrides: Record<string, any> = {}) =>
  new SchoolManager({ validators: makeValidators(), ...overrides });

const superToken = { role: 'superadmin', userId: 'admin1' };

const fakeSchool = {
  _id: 'school1',
  name: 'Test School',
  address: '123 Main St',
  phone: '555-0100',
  email: 'test@school.com',
  website: 'https://test.school',
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SchoolManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────── createSchool ────────────────────────────
  describe('createSchool()', () => {
    it('creates a school and returns the document', async () => {
      getMock().findOne.mockResolvedValue(null);
      getMock().create.mockResolvedValue(fakeSchool);

      const manager = makeManager();
      const result: any = await manager.createSchool({
        __token: superToken,
        __superadmin: superToken,
        name: 'Test School',
        address: '123 Main St',
      });

      expect(result.name).toBe('Test School');
      expect(getMock().create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test School', address: '123 Main St' }),
      );
    });

    it('returns error if a school with the same name exists', async () => {
      getMock().findOne.mockResolvedValue(fakeSchool);

      const manager = makeManager();
      const result: any = await manager.createSchool({
        __token: superToken,
        __superadmin: superToken,
        name: 'Test School',
        address: '123 Main St',
      });

      expect(result.error).toMatch(/already exists/i);
      expect(getMock().create).not.toHaveBeenCalled();
    });

    it('returns validation errors early', async () => {
      const validators = {
        school: {
          createSchool: jest.fn().mockResolvedValue({ errors: ['name is required'] }),
          updateSchool: jest.fn().mockResolvedValue(null),
        },
      };
      const manager = makeManager({ validators });
      const result: any = await manager.createSchool({
        __token: superToken,
        __superadmin: superToken,
        name: '',
        address: '123 Main St',
      });

      expect(result.errors).toContain('name is required');
      expect(getMock().findOne).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────── getSchool ───────────────────────────────
  describe('getSchool()', () => {
    it('returns the school when found', async () => {
      getMock().findById.mockResolvedValue(fakeSchool);

      const manager = makeManager();
      const result: any = await manager.getSchool({
        __token: superToken,
        __superadmin: superToken,
        __query: { id: 'school1' },
      });

      expect(result._id).toBe('school1');
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.getSchool({
        __token: superToken,
        __superadmin: superToken,
        __query: {},
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns error when school not found', async () => {
      getMock().findById.mockResolvedValue(null);

      const manager = makeManager();
      const result: any = await manager.getSchool({
        __token: superToken,
        __superadmin: superToken,
        __query: { id: 'nonexistent' },
      });

      expect(result.error).toMatch(/not found/i);
    });
  });

  // ──────────────────────────────── getSchools ──────────────────────────────
  describe('getSchools()', () => {
    it('returns paginated school list', async () => {
      const mockFind = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([fakeSchool]),
      };
      getMock().find.mockReturnValue(mockFind);
      getMock().countDocuments.mockResolvedValue(1);

      const manager = makeManager();
      const result: any = await manager.getSchools({
        __token: superToken,
        __superadmin: superToken,
        __query: { page: '1', limit: '10' },
      });

      expect(result.schools).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('defaults to page 1 and limit 20 when not specified', async () => {
      const mockFind = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };
      getMock().find.mockReturnValue(mockFind);
      getMock().countDocuments.mockResolvedValue(0);

      const manager = makeManager();
      const result: any = await manager.getSchools({
        __token: superToken,
        __superadmin: superToken,
        __query: {},
      });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ──────────────────────────────── updateSchool ────────────────────────────
  describe('updateSchool()', () => {
    it('updates and returns the updated school', async () => {
      const updated = { ...fakeSchool, name: 'Updated School' };
      getMock().findByIdAndUpdate.mockResolvedValue(updated);

      const manager = makeManager();
      const result: any = await manager.updateSchool({
        __token: superToken,
        __superadmin: superToken,
        id: 'school1',
        name: 'Updated School',
      });

      expect(result.name).toBe('Updated School');
      expect(getMock().findByIdAndUpdate).toHaveBeenCalledWith(
        'school1',
        { name: 'Updated School' },
        { new: true },
      );
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.updateSchool({
        __token: superToken,
        __superadmin: superToken,
        id: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns error when school is not found', async () => {
      getMock().findByIdAndUpdate.mockResolvedValue(null);

      const manager = makeManager();
      const result: any = await manager.updateSchool({
        __token: superToken,
        __superadmin: superToken,
        id: 'nonexistent',
        name: 'X',
      });

      expect(result.error).toMatch(/not found/i);
    });
  });

  // ──────────────────────────────── deleteSchool ────────────────────────────
  describe('deleteSchool()', () => {
    it('deletes the school and returns a success message', async () => {
      getMock().findByIdAndDelete.mockResolvedValue(fakeSchool);

      const manager = makeManager();
      const result: any = await manager.deleteSchool({
        __token: superToken,
        __superadmin: superToken,
        id: 'school1',
      });

      expect(result.message).toMatch(/deleted/i);
    });

    it('returns error when id is missing', async () => {
      const manager = makeManager();
      const result: any = await manager.deleteSchool({
        __token: superToken,
        __superadmin: superToken,
        id: '',
      });

      expect(result.error).toMatch(/required/i);
    });

    it('returns error when school is not found', async () => {
      getMock().findByIdAndDelete.mockResolvedValue(null);

      const manager = makeManager();
      const result: any = await manager.deleteSchool({
        __token: superToken,
        __superadmin: superToken,
        id: 'nonexistent',
      });

      expect(result.error).toMatch(/not found/i);
    });
  });
});
