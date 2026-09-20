import { Repository } from '../../libs/repository/repository.interface.js';
import { ExistsChecker } from '../../libs/middleware/exists-checker.interface.js';
import { DocumentComment } from './comment.entity.js';
import { CreateComment } from './comment.interface.js';

export interface CommentRepository extends Repository<DocumentComment>, ExistsChecker {
  create(dto: CreateComment): Promise<DocumentComment>;
  findByOfferId(offerId: string): Promise<DocumentComment[]>;
  findById(id: string): Promise<DocumentComment | null>;
  deleteById(id: string): Promise<boolean>;
  deleteByOfferId(offerId: string): Promise<number>;
  existsById(id: string): Promise<boolean>;
}
