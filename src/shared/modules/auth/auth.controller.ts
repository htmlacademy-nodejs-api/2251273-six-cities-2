import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ZodError } from 'zod';
import { BaseController } from '../../libs/controller/index.js';
import { HttpMethod } from '../../libs/controller/http-method.enum.js';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { ValidateDtoMiddleware } from '../../libs/middleware/validate-dto.middleware.js';
import { AuthService, AuthError } from './auth.service.js';
import { loginSchema } from './auth.dto.js';
import { extractBearerToken } from '../../helpers/auth.helpers.js';
import { AuthMiddleware } from './auth.middleware.js';
import { UserService } from '../user/user.service.js';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.AuthService) private readonly authService: AuthService,
    @inject(TYPES.AuthMiddleware) private readonly authMiddleware: AuthMiddleware,
    @inject(TYPES.UserService) private readonly userService: UserService,
  ) {
    super(logger);
    this.initRoutes();
  }

  private initRoutes(): void {
    this.addRoute(
      HttpMethod.Post,
      '/login',
      this.login,
      [new ValidateDtoMiddleware(loginSchema)],
    );

    this.addRoute(HttpMethod.Post, '/logout', this.logout, [this.authMiddleware]);

    this.addRoute(HttpMethod.Get, '/check', this.check, [this.authMiddleware]);
  }

  private login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body;
      const result = await this.authService.login(dto, {
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });

      this.ok(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((i) => i.message).join(', ') || 'Validation error';
        this.badRequest(res, message);
        return;
      }
      if (error instanceof AuthError) {
        this.unauthorized(res, error.message);
        return;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`AuthController: login failed: ${msg}`);
      this.internalServerError(res, 'Login failed');
    }
  };

  private logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        this.unauthorized(res, 'Authorization token is required');
        return;
      }

      const revoked = await this.authService.revoke(token);
      if (!revoked) {
        this.unauthorized(res, 'Invalid or already revoked token');
        return;
      }

      this.ok(res, { message: 'Logged out successfully' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`AuthController: logout failed: ${msg}`);
      this.internalServerError(res, 'Logout failed');
    }
  };

  private check = async (req: Request, res: Response): Promise<void> => {
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      this.unauthorized(res, 'User not found');
      return;
    }

    this.ok(res, user);
  };
}
