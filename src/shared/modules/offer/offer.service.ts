import { injectable, inject } from 'inversify';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { OfferRepository } from './offer.repository.interface.js';
import { UserRepository } from '../user/user.repository.interface.js';
import { CommentRepository } from '../comment/comment.repository.interface.js';
import { DocumentOffer } from './offer.entity.js';
import { CityName, CreateOfferInput, UpdateOffer } from './offer.interface.js';

export interface OfferService {
  create(publicUserId: string, dto: CreateOfferInput): Promise<DocumentOffer>;
  update(publicOfferId: string, publicUserId: string, dto: UpdateOffer): Promise<DocumentOffer | null>;
  findById(id: string): Promise<DocumentOffer | null>;
  findAll(limit?: number): Promise<DocumentOffer[]>;
  findByCity(city: CityName, limit?: number): Promise<DocumentOffer[]>;
  findPremiumByCity(city: CityName, limit?: number): Promise<DocumentOffer[]>;
  findByUserId(publicUserId: string, limit?: number): Promise<DocumentOffer[]>;
  findFavorites(publicUserId: string, limit?: number): Promise<DocumentOffer[]>;
  deleteById(id: string): Promise<boolean>;
}

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(TYPES.CommentRepository) private readonly commentRepository: CommentRepository,
  ) {}

  public async create(publicUserId: string, dto: CreateOfferInput): Promise<DocumentOffer> {
    this.logger.info(`DefaultOfferService: Creating offer for user ${publicUserId}`);
    const user = await this.userRepository.findById(publicUserId);
    if (!user) {
      throw new Error(`User with id ${publicUserId} not found`);
    }
    return this.offerRepository.create({
      ...dto,
      isPremium: dto.isPremium ?? false,
      user: user._id,
    });
  }

  public async update(
    publicOfferId: string,
    _publicUserId: string,
    dto: UpdateOffer,
  ): Promise<DocumentOffer | null> {
    this.logger.info(`DefaultOfferService: Updating offer ${publicOfferId}`);
    const existing = await this.offerRepository.findById(publicOfferId);
    if (!existing) {
      return null;
    }
    return this.offerRepository.updateById(publicOfferId, dto);
  }

  public async findById(id: string): Promise<DocumentOffer | null> {
    return this.offerRepository.findById(id);
  }

  public async findAll(limit?: number): Promise<DocumentOffer[]> {
    return this.offerRepository.findAll(limit);
  }

  public async findByCity(city: CityName, limit?: number): Promise<DocumentOffer[]> {
    return this.offerRepository.findByCity(city, limit);
  }

  public async findPremiumByCity(city: CityName, limit: number = 3): Promise<DocumentOffer[]> {
    const safeLimit = Math.min(Math.max(1, limit), 3);
    return this.offerRepository.findPremiumByCity(city, safeLimit);
  }

  public async findByUserId(publicUserId: string, limit: number = 60): Promise<DocumentOffer[]> {
    const user = await this.userRepository.findById(publicUserId);
    if (!user) {
      throw new Error(`User with id ${publicUserId} not found`);
    }
    return this.offerRepository.findByUserId(user._id.toString(), limit);
  }

  public async findFavorites(publicUserId: string, limit: number = 60): Promise<DocumentOffer[]> {
    this.logger.debug(`DefaultOfferService: Finding favorites for user ${publicUserId}`);
    const user = await this.userRepository.findById(publicUserId);
    if (!user) {
      throw new Error(`User with id ${publicUserId} not found`);
    }
    if (user.favorites.length === 0) {
      return [];
    }
    return this.offerRepository.findByIds(user.favorites, limit);
  }

  public async deleteById(id: string): Promise<boolean> {
    this.logger.info(`DefaultOfferService: Deleting offer ${id}`);

    const existing = await this.offerRepository.findById(id);
    if (!existing) {
      return false;
    }

    const deletedComments = await this.commentRepository.deleteByOfferId(existing._id.toString());
    this.logger.info(`DefaultOfferService: Deleted ${deletedComments} comments for offer ${id}`);

    return this.offerRepository.deleteById(id);
  }
}
