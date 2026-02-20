import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  userKey?: string;
  role: string;
  schoolId?: string;
  sessionId?: string;
  deviceId?: string;
}

export default class TokenManager {
  private config: any;
  private longTokenExpiresIn: string;
  private shortTokenExpiresIn: string;

  constructor({ config }: { config: any }) {
    this.config = config;
    this.longTokenExpiresIn = '3y';
    this.shortTokenExpiresIn = '1y';
  }

  genLongToken({
    userId,
    userKey,
    role,
    schoolId,
  }: {
    userId: string;
    userKey?: string;
    role: string;
    schoolId?: string;
  }): string {
    return jwt.sign(
      { userId, userKey, role, schoolId },
      this.config.dotEnv.LONG_TOKEN_SECRET,
      { expiresIn: this.longTokenExpiresIn as any }
    );
  }

  genShortToken({
    userId,
    userKey,
    role,
    schoolId,
    sessionId,
    deviceId,
  }: {
    userId: string;
    userKey?: string;
    role: string;
    schoolId?: string;
    sessionId?: string;
    deviceId?: string;
  }): string {
    return jwt.sign(
      { userId, userKey, role, schoolId, sessionId, deviceId },
      this.config.dotEnv.SHORT_TOKEN_SECRET,
      { expiresIn: this.shortTokenExpiresIn as any }
    );
  }

  _verifyToken({ token, secret }: { token: string; secret: string }): TokenPayload | null {
    let decoded: TokenPayload | null = null;
    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch (err) {
      console.log(err);
    }
    return decoded;
  }

  verifyLongToken({ token }: { token: string }): TokenPayload | null {
    return this._verifyToken({ token, secret: this.config.dotEnv.LONG_TOKEN_SECRET });
  }

  verifyShortToken({ token }: { token: string }): TokenPayload | null {
    return this._verifyToken({ token, secret: this.config.dotEnv.SHORT_TOKEN_SECRET });
  }
}
