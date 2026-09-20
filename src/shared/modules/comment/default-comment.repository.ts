import { injectable, inject } from 'inversify';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { CommentRepository } from './comment.repository.interface.js';
import { DocumentComment, CommentModel } from './comment.entity.js';
import { CreateComment } from './comment.interface.js';

@injectable()
export class DefaultCommentRepository implements CommentRepository {
  constructor(@inject(TYPES.Logger) private readonly logger: LoggerInterface) {}

  public async create(dto: CreateComment): Promise<DocumentComment> {
    this.logger.info('DefaultCommentRepository: Creating new comment');
    const comment = new CommentModel(dto);
    return comment.save();
  }

  public async findByOfferId(offerId: string): Promise<DocumentComment[]> {
    this.logger.debug(`DefaultCommentRepository: Searching comments by offer ID ${offerId}`);
    return CommentModel.find({ offer: offerId }).populate('user').populate('offer').sort({ createdAt: -1 }).exec();
  }

  public async findById(id: string): Promise<DocumentComment | null> {
    this.logger.debug(`DefaultCommentRepository: Searching comment by ID ${id}`);
    return CommentModel.findOne({ id }).populate('user').populate('offer').exec();
  }

  public async deleteById(id: string): Promise<boolean> {
    this.logger.info(`DefaultCommentRepository: Deleting comment by ID ${id}`);
    const result = await CommentModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  public async deleteByOfferId(offerId: string): Promise<number> {
    this.logger.info(`DefaultCommentRepository: Deleting comments for offer ${offerId}`);
    const result = await CommentModel.deleteMany({ offer: offerId }).exec();
    return result.deletedCount ?? 0;
  }

  public async existsById(id: string): Promise<boolean> {
    const count = await CommentModel.countDocuments({ id }).exec();
    return count > 0;
  }
}
