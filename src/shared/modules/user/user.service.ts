import { inject, injectable } from 'inversify';
import { hash } from 'bcrypt';
import { TYPES } from '../../libs/container/container.types.js';
import { LoggerInterface } from '../../libs/logger/logger.interface.js';
import { UserRepository } from './user.repository.interface.js';
import { DocumentUser } from './user.entity.js';
import { CreateUserInput, PublicUser } from './user.interface.js';

const SALT_ROUNDS = 10;

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  public async create(dto: CreateUserInput): Promise<PublicUser> {
    this.logger.info('UserService: Creating new user');
    const passwordHash = await hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      avatarUrl: dto.avatarUrl ?? '',
    });
    return this.toPublicUser(user);
  }

  public async findById(id: string): Promise<PublicUser | null> {
    this.logger.debug('UserService: Searching user by public id');
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }
    return this.toPublicUser(user);
  }

  public async findByEmailForAuth(email: string): Promise<DocumentUser | null> {
    this.logger.debug('UserService: Searching user for auth by email');
    return this.userRepository.findByEmailForAuth(email);
  }

  public toPublicUser(user: DocumentUser): PublicUser {
    const publicUser = user.toJSON() as Record<string, unknown>;
    delete publicUser.password;
    return publicUser as PublicUser;
  }

  public async updateAvatar(userId: string, avatarUrl: string): Promise<PublicUser | null> {
    const user = await this.userRepository.updateById(userId, { avatarUrl });
    return user ? this.toPublicUser(user) : null;
  }
}
