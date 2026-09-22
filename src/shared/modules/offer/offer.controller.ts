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
import { createOfferSchema, updateOfferSchema } from './offer.dto.js';
import { AuthMiddleware } from '../auth/auth.middleware.js';
import { OptionalAuthMiddleware } from '../auth/optional-auth.middleware.js';
import { CityName } from './offer.interface.js';
import { UserService } from '../user/user.service.js';
import { OfferOwnerMiddleware } from '../../libs/middleware/offer-owner.middleware.js';

type ParamOfferId = { offerId: string };
type ParamUserId = { userId: string };
type ParamCity = { city: string };

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(TYPES.Logger) protected override readonly logger: LoggerInterface,
    @inject(TYPES.OfferService) private readonly offerService: OfferService,
    @inject(TYPES.AuthMiddleware) private readonly authMiddleware: AuthMiddleware,
    @inject(TYPES.OptionalAuthMiddleware)
    private readonly optionalAuthMiddleware: OptionalAuthMiddleware,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(TYPES.UserService) private readonly userService: UserService,
    @inject(TYPES.OfferOwnerMiddleware)
    private readonly offerOwnerMiddleware: OfferOwnerMiddleware,
  ) {
    super(logger);
    this.initRoutes();
  }

  private initRoutes(): void {
    this.addRoute(HttpMethod.Get, '/offers', this.index, [this.optionalAuthMiddleware]);

    this.addRoute(HttpMethod.Get, '/offers/favorites', this.favorites, [this.authMiddleware]);

    this.addRoute(
      HttpMethod.Get,
      '/offers/premium/:city',
      this.premium,
      [this.optionalAuthMiddleware],
    );

    this.addRoute(
      HttpMethod.Get,
      '/users/:userId/offers',
      this.getByUserId,
      [
        new ValidateObjectIdMiddleware('userId'),
        new DocumentExistsMiddleware(this.userRepository, 'userId', 'User'),
      ],
    );

    this.addRoute(
      HttpMethod.Get,
      '/offers/:offerId',
      this.show,
      [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
        this.optionalAuthMiddleware,
      ],
    );

    this.addRoute(
      HttpMethod.Post,
      '/offers',
      this.create,
      [this.authMiddleware, new ValidateDtoMiddleware(createOfferSchema)],
    );

    this.addRoute(
      HttpMethod.Patch,
      '/offers/:offerId',
      this.update,
      [
        new ValidateObjectIdMiddleware('offerId'),
        this.authMiddleware,
        new ValidateDtoMiddleware(updateOfferSchema),
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
        this.offerOwnerMiddleware,
      ],
    );

    this.addRoute(
      HttpMethod.Delete,
      '/offers/:offerId',
      this.delete,
      [
        new ValidateObjectIdMiddleware('offerId'),
        this.authMiddleware,
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
        this.offerOwnerMiddleware,
      ],
    );

    this.addRoute(
      HttpMethod.Post,
      '/offers/:offerId/favorite',
      this.addFavorite,
      [
        new ValidateObjectIdMiddleware('offerId'),
        this.authMiddleware,
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
      ],
    );

    this.addRoute(
      HttpMethod.Delete,
      '/offers/:offerId/favorite',
      this.removeFavorite,
      [
        new ValidateObjectIdMiddleware('offerId'),
        this.authMiddleware,
        new DocumentExistsMiddleware(this.offerRepository, 'offerId', 'Offer'),
      ],
    );
  }

  private index = async (req: Request, res: Response): Promise<void> => {
    const limitParam = req.query.limit ? Number(req.query.limit) : 60;
    const limit = Math.min(Math.max(1, limitParam), 100);
    const cityQuery = req.query.city as string | undefined;
    const validCities: CityName[] = [
      'Paris', 'Cologne', 'Brussels', 'Amsterdam', 'Hamburg', 'Dusseldorf',
    ];
    const city =
      cityQuery && validCities.includes(cityQuery as CityName)
        ? (cityQuery as CityName)
        : undefined;

    const offers = city
      ? await this.offerService.findByCity(city, limit)
      : await this.offerService.findAll(limit);

    const userId = req.tokenUserId;
    const favoriteIds = userId ? await this.userService.getFavoriteOfferIds(userId) : [];

    const payload = offers.map((offer) => {
      const obj = offer.toJSON() as Record<string, unknown>;
      obj.isFavorite = userId ? favoriteIds.includes(offer.id) : false;
      return obj;
    });

    this.ok(res, payload);
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
    if (!offer) {
      this.notFound(res, `Offer with id ${offerId} not found`);
      return;
    }

    const userId = req.tokenUserId;
    const favoriteIds = userId ? await this.userService.getFavoriteOfferIds(userId) : [];

    const payload = offer.toJSON() as Record<string, unknown>;
    payload.isFavorite = userId ? favoriteIds.includes(offer.id) : false;

    this.ok(res, payload);
  };

  private favorites = async (req: Request, res: Response): Promise<void> => {
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    const limitParam = req.query.limit ? Number(req.query.limit) : 60;
    const limit = Math.min(Math.max(1, limitParam), 100);

    const offers = await this.offerService.findFavorites(userId, limit);
    const favoriteIds = await this.userService.getFavoriteOfferIds(userId);

    const payload = offers.map((offer) => {
      const obj = offer.toJSON() as Record<string, unknown>;
      obj.isFavorite = favoriteIds.includes(offer.id);
      return obj;
    });

    this.ok(res, payload);
  };

  private premium = async (req: Request<ParamCity>, res: Response): Promise<void> => {
    const { city: cityParam } = req.params;
    const validCities: CityName[] = [
      'Paris', 'Cologne', 'Brussels', 'Amsterdam', 'Hamburg', 'Dusseldorf',
    ];

    if (!validCities.includes(cityParam as CityName)) {
      this.badRequest(res, `Unknown city: ${cityParam}`);
      return;
    }

    const city = cityParam as CityName;
    const offers = await this.offerService.findPremiumByCity(city, 3);

    const userId = req.tokenUserId;
    const favoriteIds = userId ? await this.userService.getFavoriteOfferIds(userId) : [];

    const payload = offers.map((offer) => {
      const obj = offer.toJSON() as Record<string, unknown>;
      obj.isFavorite = userId ? favoriteIds.includes(offer.id) : false;
      return obj;
    });

    this.ok(res, payload);
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

  private update = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    try {
      const dto = req.body;
      const updated = await this.offerService.update(offerId, userId, dto);
      if (!updated) {
        this.notFound(res, `Offer with id ${offerId} not found`);
        return;
      }
      this.logger.info(`OfferController: Offer ${offerId} updated by user ${userId}`);
      this.ok(res, updated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OfferController: update failed: ${msg}`);
      this.internalServerError(res, 'Failed to update offer');
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

  private addFavorite = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    try {
      await this.userService.addFavorite(userId, offerId);
      const offer = await this.offerService.findById(offerId);
      if (!offer) {
        this.notFound(res, `Offer with id ${offerId} not found`);
        return;
      }
      const payload = offer.toJSON() as Record<string, unknown>;
      payload.isFavorite = true;
      this.logger.info(`OfferController: Offer ${offerId} added to favorites of user ${userId}`);
      this.ok(res, payload);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OfferController: addFavorite failed: ${msg}`);
      this.internalServerError(res, 'Failed to add offer to favorites');
    }
  };

  private removeFavorite = async (req: Request<ParamOfferId>, res: Response): Promise<void> => {
    const { offerId } = req.params;
    const userId = req.tokenUserId;
    if (!userId) {
      this.unauthorized(res, 'User is not authenticated');
      return;
    }

    try {
      await this.userService.removeFavorite(userId, offerId);
      this.logger.info(`OfferController: Offer ${offerId} removed from favorites of user ${userId}`);
      this.noContent(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OfferController: removeFavorite failed: ${msg}`);
      this.internalServerError(res, 'Failed to remove offer from favorites');
    }
  };
}
