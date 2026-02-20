export default ({ managers }: any) => {
  return ({ req, res, next }: any) => {
    next(req.query);
  };
};
