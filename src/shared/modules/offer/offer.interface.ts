import { Types } from 'mongoose';
import { OfferGood } from './offer.dto.js';

export type OfferType = 'apartment' | 'house' | 'room' | 'hotel';
export type CityName =
  | 'Paris'
  | 'Cologne'
  | 'Brussels'
  | 'Amsterdam'
  | 'Hamburg'
  | 'Dusseldorf';

export interface OfferInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  type: OfferType;
  price: number;
  previewImage: string;
  cityName: CityName;
  cityLatitude: number;
  cityLongitude: number;
  cityZoom: number;
  offerLatitude: number;
  offerLongitude: number;
  offerZoom: number;
  isPremium: boolean;
  rating: number;
  description: string;
  bedrooms: number;
  offerGoods: OfferGood[];
  user: Types.ObjectId;
  images: string[];
  maxAdults: number;
  commentsCount: number;
}

export type CreateOffer = Omit<
  OfferInterface,
  'id' | 'createdAt' | 'updatedAt' | 'commentsCount' | 'rating'
>;

export type CreateOfferInput = Omit<CreateOffer, 'user'>;

export type UpdateOffer = Partial<
  Omit<OfferInterface, 'id' | 'createdAt' | 'updatedAt' | 'commentsCount' | 'rating' | 'user'>
>;
