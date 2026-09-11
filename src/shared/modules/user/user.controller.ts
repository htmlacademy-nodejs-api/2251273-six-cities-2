import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ZodError } from 'zod';
import { BaseController } from '../../libs/controller/index.js';
import { HttpMethod } from '../../libs/controller/http-method.enum.js';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { ValidateObjectIdMiddleware } from '../../libs/middleware/validate-objectid.middleware.js';
import { ValidateDtoMiddleware } from '../../libs/middleware/validate-dto.middleware.js';
import { DocumentExistsMiddleware } from '../../libs/middleware/document-exists.middleware.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.interface.js';
import { createUserSchema } from './user.dto.js';
import { RestConfig } from '../../libs/config/index.js';
import { FileMiddleware } from '../../libs/middleware/file.middleware.js';

type ParamUserId = { userId: string };

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.UserService) private readonly userService: UserService,
    @inject(TYPES.Config) private readonly config: RestConfig,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {
    super(logger);
    this.initRoutes();
  }

  private initRoutes(): void {
    this.addRoute(
      HttpMethod.Post,
      '/',
      this.create,
      [new ValidateDtoMiddleware(createUserSchema)]
    );

    this.addRoute(
      HttpMethod.Get,
      '/:userId',
      this.show,
      [
        new ValidateObjectIdMiddleware('userId'),
        new DocumentExistsMiddleware(this.userRepository, 'userId', 'User'), // ✅ DB check
      ]
    );

    this.addRoute(
      HttpMethod.Post,
      '/:userId/avatar',
      this.uploadAvatar,
      [
        new ValidateObjectIdMiddleware('userId'),
        new DocumentExistsMiddleware(this.userRepository, 'userId', 'User'), // ✅ DB check
        new FileMiddleware(this.config.get('uploadDirectory'), 'avatar', 1024 * 1024),
      ]
    );
  }

  private create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body;
      const user = await this.userService.create(dto);
      this.logger.info(`UserController: User created with id ${user.id}`);
      this.created(res, user);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((i) => i.message).join(', ') || 'Validation error';
        this.badRequest(res, message);
        return;
      }
      if (isMongoDuplicateKeyError(error)) {
        this.conflict(res, 'User with this email already exists');
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`UserController: Unexpected error: ${errorMessage}`);
      this.internalServerError(res, 'Failed to create user');
    }
  };

  private show = async (req: Request<ParamUserId>, res: Response): Promise<void> => {
    const { userId } = req.params;
    const user = await this.userService.findById(userId.trim());
    this.ok(res, user);
  };

  private uploadAvatar = async (req: Request<ParamUserId>, res: Response): Promise<void> => {
    const reqWithFile = req as Request & { file?: Express.Multer.File };
    if (!reqWithFile.file) {
      this.badRequest(res, 'No file uploaded');
      return;
    }
    try {
      const { userId } = req.params;
      const avatarUrl = `/upload/${reqWithFile.file.filename}`;
      const updatedUser = await this.userService.updateAvatar(userId, avatarUrl);
      this.ok(res, updatedUser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`UserController: uploadAvatar failed: ${msg}`);
      this.internalServerError(res, 'Failed to upload avatar');
    }
  };
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}
