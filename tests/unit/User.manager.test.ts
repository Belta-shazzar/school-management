/**
 * Unit tests for UserManager.
 *
 * All MongoDB model calls and bcrypt are mocked so no database is needed.
 */

import UserManager from '../../src/managers/entities/user/User.manager';

// ─── Mock the Mongoose model ─────────────────────────────────────────────────
jest.mock('../../src/managers/entities/user/User.mongoModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// ─── Mock bcrypt ─────────────────────────────────────────────────────────────
jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn(),
  },
}));

// ─── Access mocked modules at runtime ────────────────────────────────────────
const getMockUserModel = (): any =>
  (jest.requireMock('../../src/managers/entities/user/User.mongoModel') as any).default;

const getMockBcrypt = (): any =>
  (jest.requireMock('bcrypt') as any).default;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeTokenManager = () => ({
  genLongToken: jest.fn().mockReturnValue('mock-jwt-token'),
});

const makeValidators = () => ({
  user: {
    register: jest.fn().mockResolvedValue(null),
    login: jest.fn().mockResolvedValue(null),
  },
});

const makeManager = (overrides: Record<string, any> = {}) => {
  const managers = { token: makeTokenManager() };
  const validators = makeValidators();
  return new UserManager({ config: {}, managers, validators, mongomodels: {}, ...overrides });
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('UserManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────── register ────────────────────────────────
  describe('register()', () => {
    const validInput = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
    };

    it('creates a new user and returns user object + longToken', async () => {
      getMockUserModel().findOne.mockResolvedValue(null);
      getMockUserModel().create.mockResolvedValue({
        _id: 'userId123',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'school_admin',
        schoolId: null,
      });

      const manager = makeManager();
      const result: any = await manager.register(validInput);

      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('johndoe');
      expect(result.longToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('returns error if user with same email or username already exists', async () => {
      getMockUserModel().findOne.mockResolvedValue({ _id: 'existing' });

      const manager = makeManager();
      const result: any = await manager.register(validInput);

      expect(result.error).toMatch(/already exists/i);
    });

    it('defaults role to school_admin when role is invalid', async () => {
      getMockUserModel().findOne.mockResolvedValue(null);
      getMockUserModel().create.mockResolvedValue({
        _id: 'userId123',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'school_admin',
        schoolId: null,
      });

      const manager = makeManager();
      await manager.register({ ...validInput, role: 'invalid_role' });

      expect(getMockUserModel().create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'school_admin' }),
      );
    });

    it('accepts superadmin as a valid role', async () => {
      getMockUserModel().findOne.mockResolvedValue(null);
      getMockUserModel().create.mockResolvedValue({
        _id: 'userId123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'superadmin',
        schoolId: null,
      });

      const manager = makeManager();
      await manager.register({ ...validInput, role: 'superadmin' });

      expect(getMockUserModel().create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'superadmin' }),
      );
    });

    it('hashes the password before storing', async () => {
      getMockUserModel().findOne.mockResolvedValue(null);
      getMockUserModel().create.mockResolvedValue({
        _id: 'id',
        username: 'u',
        email: 'e@e.com',
        role: 'school_admin',
        schoolId: null,
      });

      const manager = makeManager();
      await manager.register(validInput);

      expect(getMockUserModel().create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashedPassword' }),
      );
    });

    it('returns validation errors from the validator', async () => {
      const validationError = { errors: ['email is required'] };
      const validators = {
        user: {
          register: jest.fn().mockResolvedValue(validationError),
          login: jest.fn().mockResolvedValue(null),
        },
      };

      const manager = makeManager({ validators });
      const result: any = await manager.register({ username: 'u', email: '', password: 'p' });

      expect(result).toEqual(validationError);
      expect(getMockUserModel().findOne).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────── login ───────────────────────────────────
  describe('login()', () => {
    const credentials = { email: 'john@example.com', password: 'Password1!' };

    it('returns user + longToken for correct credentials', async () => {
      const fakeUser = {
        _id: 'userId123',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'school_admin',
        schoolId: null,
        password: 'hashedPassword',
      };
      getMockUserModel().findOne.mockResolvedValue(fakeUser);
      getMockBcrypt().compare.mockResolvedValue(true);

      const manager = makeManager();
      const result: any = await manager.login(credentials);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.longToken).toBe('mock-jwt-token');
    });

    it('returns error if user is not found', async () => {
      getMockUserModel().findOne.mockResolvedValue(null);

      const manager = makeManager();
      const result: any = await manager.login(credentials);

      expect(result.error).toMatch(/invalid/i);
    });

    it('returns error if password does not match', async () => {
      getMockUserModel().findOne.mockResolvedValue({ password: 'hashedPassword' });
      getMockBcrypt().compare.mockResolvedValue(false);

      const manager = makeManager();
      const result: any = await manager.login(credentials);

      expect(result.error).toMatch(/invalid/i);
    });

    it('returns validation errors from the validator', async () => {
      const validationError = { errors: ['password is required'] };
      const validators = {
        user: {
          register: jest.fn().mockResolvedValue(null),
          login: jest.fn().mockResolvedValue(validationError),
        },
      };

      const manager = makeManager({ validators });
      const result: any = await manager.login({ email: 'a@b.com', password: '' });

      expect(result).toEqual(validationError);
      expect(getMockUserModel().findOne).not.toHaveBeenCalled();
    });
  });
});
