/**
 * School Administrator role guard middleware.
 * Must be placed AFTER __token in the middleware stack.
 * Allows both 'superadmin' and 'school_admin' roles.
 */
export default ({ managers }: any) => {
  return ({ req, res, next, results }: any) => {
    const decoded = results.__token;
    if (!decoded || !['superadmin', 'school_admin'].includes(decoded.role)) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: 'Forbidden: school administrator access required',
      });
    }
    next(decoded);
  };
};
