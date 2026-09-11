import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../../libs/controller/index.js';
import { HttpMethod } from '../../libs/controller/http-method.enum.js';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { ValidateObjectIdMiddleware } from '../../libs/middleware/validate-objectid.middleware.js';
import { ValidateDtoMiddleware } from '../../libs/middleware/validate-dto.middleware.js';
import { DocumentExistsMiddleware } from '../../libs/middleware/document-exists.middleware.js';
import { OfferService } from './offer.service.js';
import { OfferRepository } from './offer.repository.interface.js';
import { UserRepository } from '../user/user.repository.interface.js';
import { createOfferSchema } from './offer.dto.js';
import { AuthMiddleware } from '../auth/auth.middleware.js';
import { CityName } from './offer.interface.js';

type ParamOfferId = { offerId: string };
type ParamUserId = { userId: string };

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.OfferService) private readonly offerService: OfferService,
    @inject(TYPES.AuthMiddleware) private readonly authMiddleware: AuthMiddleware,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {
    super(logger);
    this.initRoutes();
  }

  private initRoutes(): void {
    this.addRoute(HttpMethod.Get, '/offers', this.index);

    this.addRoute(
      HttpMethod.Get,
      '/users/:userId/offers',
      this.getByUserId,
      [
        new ValidateObjectIdMiddleware('userId'),
        new DocumentExistsMiddleware(this.userRepository, 'userId', 'User'), // ✅ DB check
      ]
    );

    this.addRoute(
      HttpMethod.Get,
      '/offers/:offerId',
      this.show,
      [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'), // ✅ DB check
      ]
    );

    this.addRoute(
      HttpMethod.Post,
      '/offers',
      this.create,
      [this.authMiddleware, new ValidateDtoMiddleware(createOfferSchema)]
    );

    this.addRoute(
      HttpMethod.Delete,
      '/offers/:offerId',
      this.delete,
      [
        this.authMiddleware,
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'), // ✅ DB check
      ]
    );
  }

  private index = async (req: Request, res: Response): Promise<void> => {
    const limitParam = req.query.limit ? Number(req.query.limit) : 60;
    const limit = Math.min(Math.max(1, limitParam), 100);
    const cityQuery = req.query.city as string | undefined;
    const validCities: CityName[] = ['Paris', 'Cologne', 'Brussels', 'Amsterdam', 'Hamburg', 'Dusseldorf'];
    const city = cityQuery && validCities.includes(cityQuery as CityName) ? (cityQuery as CityName) : undefined;

    const offers = city ? await this.offerService.findByCity(city, limit) : await this.offerService.findAll(limit);
    this.ok(res, offers);
  };

  private getByUserId = async (req: Request<ParamUserId>, res: Response): Promise<void> => {
    const { userId } = req.params;
    const limitParam = req.query.limit ? Number(req.query.limit) : 60;
    const limit = Math.min(Math.max(1, limitParam), 100);
    const offers = await this.offerService.findByUserId(userId, limit);
    this.ok(res, offers);
  };

  private show = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const offer = await this.offerService.findById(offerId);
    this.ok(res, offer);
  };

  private create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.tokenUserId;
      if (!userId) {
        this.unauthorized(res, 'User is not authenticated');
        return;
      }
      const dto = req.body;
      const offer = await this.offerService.create(userId, dto);
      this.logger.info(`OfferController: Offer created with id ${offer.id}`);
      this.created(res, offer);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        this.notFound(res, error.message);
        return;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OfferController: create failed: ${msg}`);
      this.internalServerError(res, 'Failed to create offer');
    }
  };

  private delete = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const isDeleted = await this.offerService.deleteById(offerId);
    if (!isDeleted) {
      this.notFound(res, `Offer with id ${offerId} not found`);
      return;
    }
    this.logger.info(`OfferController: Offer ${offerId} deleted`);
    this.noContent(res);
  };
}
