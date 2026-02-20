import http from 'http';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export default class UserServer {
  private config: any;
  private userApi: any;

  constructor({ config, managers }: { config: any; managers: any }) {
    this.config = config;
    this.userApi = managers.userApi;
  }

  run(): void {
    const app = express();

    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/static', express.static('public'));

    /** Rate limiting */
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, message: 'Too many requests, please try again later.' },
    });
    app.use(limiter);

    /** Error handler */
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).send('Something broke!');
    });

    /** Single middleware to handle all API routes */
    app.all('/api/:moduleName/:fnName', this.userApi.mw);

    const server = http.createServer(app);
    server.listen(this.config.dotEnv.USER_PORT, () => {
      console.log(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`
      );
    });
  }
}
