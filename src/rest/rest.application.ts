import express, { Express } from 'express';
import { exit } from 'node:process';
import cors from 'cors';
import { injectable, inject } from 'inversify';
import { LoggerInterface } from '../shared/libs/logger/logger.interface.js';
import { RestConfig } from './../shared/libs/config/index.js';
import { DatabaseClientInterface } from './../shared/libs/database/index.js';
import { TYPES } from '../shared/libs/container/container.types.js';
import { AuthController } from './../shared/modules/auth/auth.controller.js';
import { UserController } from '../shared/modules/user/user.controller.js';
import { OfferController } from '../shared/modules/offer/offer.controller.js';
import { CommentController } from '../shared/modules/comment/index.js';
import { ExceptionFilter } from '../shared/libs/exception-filter/index.js';

@injectable()
export class RestApplication {
  private readonly app: Express;

  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.Config) private readonly config: RestConfig,
    @inject(TYPES.DatabaseClient) private readonly databaseClient: DatabaseClientInterface,
    @inject(TYPES.AuthController) private readonly authController: AuthController,
    @inject(TYPES.UserController) private readonly userController: UserController,
    @inject(TYPES.OfferController) private readonly offerController: OfferController,
    @inject(TYPES.CommentController) private readonly commentController: CommentController,
    @inject(TYPES.ExceptionFilter) private readonly exceptionFilter: ExceptionFilter,
  ) {
    this.app = express();
  }

  public async init(): Promise<void> {
    const port = this.config.get('port') || 3000;
    this.logger.info(`RestApplication: Initializing REST application on port ${port}!`);
    try {
      await this.databaseClient.connect();
      this.logger.info('RestApplication: Database connection ready for operations.');
    } catch (error) {
      this.logger.error(error as Error, 'RestApplication: Failed to connect to DB. Stopping app.');
      throw error;
    }
    this.initMiddleware();
    this.initRoutes();
    this.setupGracefulShutdown();
    this.app.listen(port, () => {
      this.logger.info(`RestApplication: Server started on http://localhost:${port}`);
    });
  }

  private initMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    const uploadDir = this.config.get('uploadDirectory');
    this.app.use('/upload', express.static(uploadDir));

    this.app.use((req, _res, next) => {
      this.logger.info(`--${req.method} ${req.url}`);
      next();
    });
    this.logger.info('RestApplication: Middleware initialized.');
  }

  private initRoutes(): void {
    this.app.use('/auth', this.authController.getRouter());
    this.app.use('/users', this.userController.getRouter());
    this.app.use(this.offerController.getRouter());
    this.app.use('/offers', this.commentController.getRouter());

    this.app.use((_req, res) => {
      res.status(404).json({
        statusCode: 404,
        message: 'Route not found',
      });
    });

    this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
    this.logger.info('RestApplication: Routes initialized.');
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`RestApplication: Received ${signal}. Shutting down gracefully...`);
      try {
        await this.databaseClient.disconnect();
        this.logger.info('RestApplication: Graceful shutdown completed.');
        exit(0);
      } catch (error) {
        this.logger.error(error as Error, 'RestApplication: Error during shutdown');
        exit(1);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}
