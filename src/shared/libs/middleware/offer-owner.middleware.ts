import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../container/container.types.js';
import { MiddlewareInterface } from './middleware.interface.js';
import { OfferRepository } from '../../modules/offer/offer.repository.interface.js';
import { DocumentUser } from '../../modules/user/user.entity.js';
import { HttpError } from '../errors/http-error.js';

type ParamOfferId = { offerId: string };

@injectable()
export class OfferOwnerMiddleware implements MiddlewareInterface {
  constructor(
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
  ) {}

  public async execute(
    req: Request<ParamOfferId>,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = req.tokenUserId;
    if (!userId) {
      throw HttpError.unauthorized('User is not authenticated');
    }

    const offer = await this.offerRepository.findById(req.params.offerId);
    if (!offer) {
      throw HttpError.notFound('Offer not found');
    }

    const populatedUser = offer.user as unknown as DocumentUser;
    if (populatedUser.id !== userId) {
      throw HttpError.forbidden('You can only delete your own offers');
    }

    next();
  }
}
