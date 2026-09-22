import { injectable, inject } from 'inversify';
import { Types } from 'mongoose';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { UserRepository } from './user.repository.interface.js';
import { DocumentUser, UserModel } from './user.entity.js';
import { CreateUserInput, UpdateUser } from './user.interface.js';

@injectable()
export class DefaultUserRepository implements UserRepository {
  constructor(@inject(TYPES.Logger) private readonly logger: LoggerInterface) {}

  public async findById(id: string): Promise<DocumentUser | null> {
    this.logger.debug('DefaultUserRepository: Searching for user by public id');
    return UserModel.findOne({ id }).exec();
  }

  public async findByInternalId(internalId: string): Promise<DocumentUser | null> {
    this.logger.debug('DefaultUserRepository: Searching for user by internal id');
    if (!Types.ObjectId.isValid(internalId)) {
      return null;
    }
    return UserModel.findById(internalId).exec();
  }

  public async findByEmail(email: string): Promise<DocumentUser | null> {
    this.logger.debug('DefaultUserRepository: Searching for user by email');
    return UserModel.findOne({ email }).exec();
  }

  public async findByEmailForAuth(email: string): Promise<DocumentUser | null> {
    this.logger.debug('DefaultUserRepository: Searching for user by email for auth');
    return UserModel.findOne({ email }).select('+password').exec();
  }

  public async create(dto: CreateUserInput): Promise<DocumentUser> {
    this.logger.info('DefaultUserRepository: Creating new user');
    const user = new UserModel(dto);
    return user.save();
  }

  public async updateById(id: string, dto: Partial<UpdateUser>): Promise<DocumentUser | null> {
    this.logger.debug(`DefaultUserRepository: Updating user ${id}`);
    return UserModel.findOneAndUpdate({ id }, { $set: dto }, { returnDocument: 'after' }).exec();
  }

  public async addFavorite(userId: string, offerId: string): Promise<DocumentUser | null> {
    this.logger.info(
      `DefaultUserRepository: Adding offer ${offerId} to favorites of user ${userId}`,
    );
    return UserModel.findOneAndUpdate(
      { id: userId },
      { $addToSet: { favorites: offerId } },
      { returnDocument: 'after' },
    ).exec();
  }

  public async removeFavorite(userId: string, offerId: string): Promise<DocumentUser | null> {
    this.logger.info(
      `DefaultUserRepository: Removing offer ${offerId} from favorites of user ${userId}`,
    );
    return UserModel.findOneAndUpdate(
      { id: userId },
      { $pull: { favorites: offerId } },
      { returnDocument: 'after' },
    ).exec();
  }

  public async existsById(id: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ id }).exec();
    return count > 0;
  }
}
