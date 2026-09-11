import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../../libs/controller/index.js';
import { HttpMethod } from '../../libs/controller/http-method.enum.js';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { ValidateObjectIdMiddleware } from '../../libs/middleware/validate-objectid.middleware.js';
import { ValidateDtoMiddleware } from '../../libs/middleware/validate-dto.middleware.js';
import { DocumentExistsMiddleware } from '../../libs/middleware/document-exists.middleware.js';
import { CommentService, CommentAccessDeniedError } from './comment.service.js';
import { CommentRepository } from './comment.repository.interface.js';
import { OfferRepository } from '../offer/offer.repository.interface.js';
import { createCommentSchema } from './comment.dto.js';
import { CreateCommentInput } from './comment.interface.js';
import { AuthMiddleware } from '../auth/auth.middleware.js';

type ParamOfferId = { offerId: string };
type ParamOfferAndCommentId = { offerId: string; commentId: string };

@injectable()
export class CommentController extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.CommentService) private readonly commentService: CommentService,
    @inject(TYPES.AuthMiddleware) private readonly authMiddleware: AuthMiddleware,
    @inject(TYPES.CommentRepository) private readonly commentRepository: CommentRepository,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
  ) {
    super(logger);
    this.initRoutes();
  }

  private initRoutes(): void {
    this.addRoute(
      HttpMethod.Get,
      '/:offerId/comments',
      this.index,
      [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
      ]
    );

    this.addRoute(
      HttpMethod.Post,
      '/:offerId/comments',
      this.create,
      [
        new ValidateObjectIdMiddleware('offerId'),
        this.authMiddleware,
        new ValidateDtoMiddleware(createCommentSchema),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
      ]
    );

    this.addRoute(
      HttpMethod.Delete,
      '/:offerId/comments/:commentId',
      this.delete,
      [
        new ValidateObjectIdMiddleware('offerId'),
        new ValidateObjectIdMiddleware('commentId'),
        this.authMiddleware,
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
        new DocumentExistsMiddleware(this.commentRepository, 'commentId', 'Comment'),
      ]
    );
  }

  private index = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const safeLimit = Math.min(Math.max(1, limit), 50);

    const comments = await this.commentService.findByOfferId(offerId, safeLimit);
    this.ok(res, comments);
  };

  private create = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const body = req.body as CreateCommentInput;
    const userId = req.tokenUserId;

    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    const comment = await this.commentService.create(offerId, body, userId);
    this.logger.info(`CommentController: Comment created with id ${comment.id}`);
    this.created(res, comment);
  };

  private delete = async (req: Request<ParamOfferAndCommentId>, res: Response): Promise<void> => {
    const { commentId } = req.params;
    const userId = req.tokenUserId;

    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    try {
      const isDeleted = await this.commentService.deleteById(commentId, userId);
      if (!isDeleted) {
        this.notFound(res, `Comment with id ${commentId} not found`);
        return;
      }
      this.logger.info(`CommentController: Comment ${commentId} deleted by user ${userId}`);
      this.noContent(res);
    } catch (error) {
      if (error instanceof CommentAccessDeniedError) {
        this.forbidden(res, error.message);
        return;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`CommentController: delete failed: ${msg}`);
      this.internalServerError(res, 'Failed to delete comment');
    }
  };
}
