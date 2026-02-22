import config from './config/index.config';
import ManagersLoader from './loaders/ManagersLoader';
import logger from './libs/logger';

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { promise, reason });
  process.exit(1);
});

/** Initialize managers and start server */
const managersLoader = new ManagersLoader({ config });
const managers = managersLoader.load();

managers.server.run();
