import { Repository } from '../../libs/repository/repository.interface.js';
import { ExistsChecker } from '../../libs/middleware/exists-checker.interface.js';
import { DocumentUser } from './user.entity.js';
import { CreateUserInput, UpdateUser } from './user.interface.js';

export interface UserRepository extends Repository<DocumentUser>, ExistsChecker {
  findById(id: string): Promise<DocumentUser | null>;
  findByInternalId(internalId: string): Promise<DocumentUser | null>;
  findByEmail(email: string): Promise<DocumentUser | null>;
  findByEmailForAuth(email: string): Promise<DocumentUser | null>;
  create(dto: CreateUserInput): Promise<DocumentUser>;
  updateById(id: string, dto: Partial<UpdateUser>): Promise<DocumentUser | null>;
  addFavorite(userId: string, offerId: string): Promise<DocumentUser | null>;
  removeFavorite(userId: string, offerId: string): Promise<DocumentUser | null>;
  existsById(id: string): Promise<boolean>;
}
