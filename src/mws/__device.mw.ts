export default ({ managers }: any) => {
  return ({ req, res, next }: any) => {
    const ip = req.ip || 'N/A';
    const agent = req.headers['user-agent'] || 'N/A';
    const device = { ip, agent };
    next(device);
  };
};
