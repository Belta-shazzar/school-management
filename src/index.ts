import config from './config/index.config';
import connectMongo from './connect/mongo';
import ManagersLoader from './loaders/ManagersLoader';

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:');
  console.log(err, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection at ', promise, 'reason:', reason);
  process.exit(1);
});

/** Connect to MongoDB */
connectMongo({ uri: config.dotEnv.MONGO_URI });

/** Initialize managers and start server */
const managersLoader = new ManagersLoader({ config });
const managers = managersLoader.load();

managers.userServer.run();
