import logger from '../libs/logger';

export default ({ managers }: any) => {
  return ({ req, res, next }: any) => {
    if (!req.headers.token) {
      logger.warn('Request rejected: missing token header', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: 'unauthorized',
      });
    }
    let decoded = null;
    try {
      decoded = managers.token.verifyLongToken({ token: req.headers.token });
      if (!decoded) {
        logger.warn('Request rejected: token could not be decoded', { ip: req.ip });
        return managers.responseDispatcher.dispatch(res, {
          ok: false,
          code: 401,
          errors: 'unauthorized',
        });
      }
    } catch (err) {
      logger.warn('Request rejected: token verification threw an error', {
        error: (err as Error).message,
        ip: req.ip,
      });
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: 'unauthorized',
      });
    }
    next(decoded);
  };
};
