import bcrypt from 'bcrypt';
import UserModel from './User.mongoModel';

export default class UserManager {
  // private config: any;
  private validators: any;
  private tokenManager: any;
  // private mongomodels: any;

  public httpExposed: string[];

  constructor({ config, managers, validators, mongomodels }: any) {
    // this.config = config;
    this.validators = validators;
    // this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.httpExposed = ['post=register', 'post=login'];
  }

  /**
   * Register a new user.
   * POST /api/auth/register
   */
  async register({
    username,
    email,
    password,
    role,
  }: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) {
    const userData = { username, email, password, role };

    // Validate input
    if (this.validators?.user?.register) {
      const validationResult = await this.validators.user.register(userData);
      if (validationResult) return validationResult;
    }

    // Check if role is valid
    const userRole = role && ['superadmin', 'school_admin'].includes(role) ? role : 'school_admin';

    // Check existing user
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return { error: 'User with this email or username already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const createdUser = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: userRole,
    });

    // Generate token
    const longToken = this.tokenManager.genLongToken({
      userId: createdUser._id.toString(),
      role: createdUser.role,
      schoolId: createdUser.schoolId?.toString(),
    });

    return {
      user: {
        _id: createdUser._id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
      },
      longToken,
    };
  }

  /**
   * Login an existing user.
   * POST /api/auth/login
   */
  async login({ email, password }: { email: string; password: string }) {
    const loginData = { email, password };

    // Validate input
    if (this.validators?.user?.login) {
      const validationResult = await this.validators.user.login(loginData);
      if (validationResult) return validationResult;
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { error: 'Invalid email or password' };
    }

    // Generate token
    const longToken = this.tokenManager.genLongToken({
      userId: user._id.toString(),
      role: user.role,
      schoolId: user.schoolId?.toString(),
    });

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      longToken,
    };
  }
}
