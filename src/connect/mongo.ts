import mongoose from 'mongoose';

export default ({ uri }: { uri: string }): void => {
  mongoose.connect(uri);

  mongoose.connection.on('connected', () => {
    console.log('💾  Mongoose default connection open to ');
  });

  mongoose.connection.on('error', (err) => {
    console.log('💾  Mongoose default connection error: ' + err);
    console.log(
      '=> if using local mongodb: make sure that mongo server is running \n' +
        '=> if using online mongodb: check your internet connection \n'
    );
  });

  mongoose.connection.on('disconnected', () => {
    console.log('💾  Mongoose default connection disconnected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close().then(() => {
      console.log('💾  Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });
};
