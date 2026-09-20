import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { MiddlewareInterface } from '../../libs/middleware/middleware.interface.js';
import { AuthService } from './auth.service.js';
import { extractBearerToken } from './../../helpers/auth.helpers.js';

@injectable()
export class OptionalAuthMiddleware implements MiddlewareInterface {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.AuthService) private readonly authService: AuthService,
  ) {}

  public async execute(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractBearerToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = await this.authService.verifyToken(token);
    if (!payload) {
      this.logger.warn('OptionalAuthMiddleware: Invalid or revoked token, proceeding as anonymous');
      next();
      return;
    }

    req.tokenUserId = payload.userId;
    req.tokenEmail = payload.email;
    next();
  }
}
