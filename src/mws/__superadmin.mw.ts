/**
 * Superadmin role guard middleware.
 * Must be placed AFTER __token in the middleware stack.
 * Checks that the decoded token has role === 'superadmin'.
 */
export default ({ managers }: any) => {
  return ({ req, res, next, results }: any) => {
    const decoded = results.__token;
    if (!decoded || decoded.role !== 'superadmin') {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: 'Forbidden: superadmin access required',
      });
    }
    next(decoded);
  };
};
