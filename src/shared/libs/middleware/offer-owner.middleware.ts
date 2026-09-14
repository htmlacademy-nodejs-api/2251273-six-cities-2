import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../controller/index.js';
import { TYPES } from '../container/container.types.js';
import { LoggerInterface } from '../logger/logger.interface.js';
import { OfferRepository } from '../../modules/offer/offer.repository.interface.js';
import { DocumentUser } from '../../modules/user/user.entity.js';

type ParamOfferId = { offerId: string };

@injectable()
export class OfferOwnerMiddleware extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
  ) {
    super(logger);
  }

  public execute = async (
    req: Request<ParamOfferId>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    const offer = await this.offerRepository.findById(req.params.offerId);
    if (!offer) {
      this.notFound(res, 'Offer not found');
      return;
    }

    const populatedUser = offer.user as unknown as DocumentUser;

    this.logger.info(`[OfferOwnerMiddleware] Проверка владельца. Token userId: "${userId}", Offer ownerId: "${populatedUser.id}"`);

    if (populatedUser.id !== userId) {
      this.forbidden(res, 'You can only delete your own offers');
      return;
    }

    next();
  };
}
