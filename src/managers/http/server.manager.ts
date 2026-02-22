import http from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import config from "../../config/index.config";
import connectMongo from "../../connect/mongo";
import swaggerDocument from "../../docs/swagger";
import logger from "../../libs/logger";

export default class Server {
  private config: any;
  private api: any;

  constructor({ config, managers }: { config: any; managers: any }) {
    this.config = config;
    this.api = managers.api;
  }

  /**
   * Builds and returns the configured Express application.
   * Does NOT connect to MongoDB or start listening — safe to use in tests.
   */
  createApp(): express.Application {
    const app = express();

    app.use(cors({ origin: "*" }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/static", express.static("public"));

    /** Rate limiting — 100 requests per 15 minutes per IP */
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        ok: false,
        message: "Too many requests, please try again later.",
      },
    });
    app.use(limiter);

    /** Swagger UI — available at GET /api-docs */
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    /** Health Check — available at GET /health */
    app.use("/health", (req, res) => {
      res.status(200).json({ status: "OK" });
    });

    /** HTTP request logger */
    app.use(
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        logger.info(`${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
        next();
      },
    );

    /** Single route handler — all API calls go through the API manager */
    app.all("/api/:moduleName/:fnName", this.api.mw);

    /** Global error handler */
    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        logger.error("Unhandled Express error", {
          error: err.message,
          stack: err.stack,
        });
        res.status(500).json({ ok: false, message: "Internal server error" });
      },
    );

    return app;
  }

  /** Connects to MongoDB and starts the HTTP server. */
  async run(): Promise<void> {
    const app = this.createApp();

    await connectMongo({ uri: config.dotEnv.MONGO_URI });

    const server = http.createServer(app);
    server.listen(this.config.dotEnv.USER_PORT, () => {
      const name = this.config.dotEnv.SERVICE_NAME?.toUpperCase() ?? "SERVER";
      logger.info(`${name} is running`, {
        port: this.config.dotEnv.USER_PORT,
        docs: `http://localhost:${this.config.dotEnv.USER_PORT}/api-docs`,
      });
    });
  }
}
