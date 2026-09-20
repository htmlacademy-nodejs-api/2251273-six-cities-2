import { Repository } from '../../libs/repository/repository.interface.js';
import { ExistsChecker } from '../../libs/middleware/exists-checker.interface.js';
import { DocumentOffer } from './offer.entity.js';
import { CityName, CreateOffer, UpdateOffer } from './offer.interface.js';

export interface OfferRepository extends Repository<DocumentOffer>, ExistsChecker {
  findById(id: string): Promise<DocumentOffer | null>;
  findByInternalId(internalId: string): Promise<DocumentOffer | null>;
  findByUserId(userId: string, limit?: number): Promise<DocumentOffer[]>;
  findByCity(city: CityName, limit?: number): Promise<DocumentOffer[]>;
  findPremiumByCity(city: CityName, limit?: number): Promise<DocumentOffer[]>;
  findAll(limit?: number): Promise<DocumentOffer[]>;
  findByIds(ids: string[], limit?: number): Promise<DocumentOffer[]>;
  deleteById(id: string): Promise<boolean>;
  create(dto: CreateOffer): Promise<DocumentOffer>;
  updateById(id: string, dto: UpdateOffer): Promise<DocumentOffer | null>;
  updateStats(offerId: string, rating: number, commentsCount: number): Promise<DocumentOffer | null>;
  existsById(id: string): Promise<boolean>;
}
