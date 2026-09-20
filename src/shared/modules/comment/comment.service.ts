import { injectable, inject } from 'inversify';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { CommentRepository } from './comment.repository.interface.js';
import { OfferRepository } from '../offer/offer.repository.interface.js';
import { UserRepository } from '../user/user.repository.interface.js';
import { DocumentComment } from './comment.entity.js';
import { CreateCommentInput } from './comment.interface.js';

export class CommentAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommentAccessDeniedError';
  }
}

export interface CommentService {
  create(publicOfferId: string, dto: CreateCommentInput, publicUserId: string): Promise<DocumentComment>;
  findByOfferId(publicOfferId: string, limit?: number): Promise<DocumentComment[]>;
  findById(id: string): Promise<DocumentComment | null>;
  deleteById(id: string, publicUserId: string): Promise<boolean>;
  deleteByOfferId(offerInternalId: string): Promise<number>;
}

@injectable()
export class DefaultCommentService implements CommentService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.CommentRepository) private readonly commentRepository: CommentRepository,
    @inject(TYPES.OfferRepository) private readonly offerRepository: OfferRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  public async create(
    publicOfferId: string,
    dto: CreateCommentInput,
    publicUserId: string,
  ): Promise<DocumentComment> {
    this.logger.info(`DefaultCommentService: Creating comment for offer ${publicOfferId}`);

    const offer = await this.offerRepository.findById(publicOfferId);
    if (!offer) {
      throw new Error(`Offer with id ${publicOfferId} not found`);
    }

    const user = await this.userRepository.findById(publicUserId);
    if (!user) {
      throw new Error(`User with id ${publicUserId} not found`);
    }

    const comment = await this.commentRepository.create({
      text: dto.text,
      rating: dto.rating,
      offer: offer._id,
      user: user._id,
    });

    await this.recalculateOfferStats(offer._id.toString());

    const populated = await this.commentRepository.findById(comment.id);
    return populated ?? comment;
  }

  public async findByOfferId(publicOfferId: string, limit: number = 50): Promise<DocumentComment[]> {
    this.logger.debug(`DefaultCommentService: Finding comments for offer ${publicOfferId}`);

    const offer = await this.offerRepository.findById(publicOfferId);
    if (!offer) {
      throw new Error(`Offer with id ${publicOfferId} not found`);
    }

    const comments = await this.commentRepository.findByOfferId(offer._id.toString());
    return comments.slice(0, limit);
  }

  public async findById(id: string): Promise<DocumentComment | null> {
    this.logger.debug(`DefaultCommentService: Finding comment by id ${id}`);
    return this.commentRepository.findById(id);
  }

  public async deleteById(id: string, publicUserId: string): Promise<boolean> {
    this.logger.info(`DefaultCommentService: Deleting comment ${id}`);

    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      return false;
    }

    const user = await this.userRepository.findById(publicUserId);
    if (!user) {
      throw new Error(`User with id ${publicUserId} not found`);
    }

    const commentUserId = (comment.user as { _id: { toString(): string } })._id.toString();
    if (commentUserId !== user._id.toString()) {
      throw new CommentAccessDeniedError('You can only delete your own comments');
    }

    const offerInternalId = (comment.offer as { _id: { toString(): string } })._id.toString();
    const result = await this.commentRepository.deleteById(id);

    if (result) {
      await this.recalculateOfferStats(offerInternalId);
    }

    return result;
  }

  public async deleteByOfferId(offerInternalId: string): Promise<number> {
    this.logger.info(`DefaultCommentService: Deleting comments for offer ${offerInternalId}`);
    return this.commentRepository.deleteByOfferId(offerInternalId);
  }

  private async recalculateOfferStats(offerInternalId: string): Promise<void> {
    const comments = await this.commentRepository.findByOfferId(offerInternalId);
    const rating = comments.length > 0
      ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
      : 0;
    const commentsCount = comments.length;

    this.logger.debug(
      `DefaultCommentService: Recalculated offer ${offerInternalId}: rating=${rating.toFixed(2)}, comments=${commentsCount}`,
    );

    await this.offerRepository.updateStats(offerInternalId, rating, commentsCount);
  }
}
