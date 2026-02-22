import mongoose from 'mongoose';
import logger from '../libs/logger';

export default async ({ uri }: { uri: string }): Promise<void> => {
  await mongoose.connect(uri);

  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connection established');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error', { error: err.message });
    logger.warn(
      'Check that MongoDB is running (local) or that your internet connection is active (Atlas)'
    );
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose connection disconnected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close().then(() => {
      logger.info('Mongoose connection closed via SIGINT');
      process.exit(0);
    });
  });
};
