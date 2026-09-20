import { Document, model, Model, Schema, Types } from 'mongoose';
import { generateId } from './../../helpers/index.js';
import { OfferInterface } from './offer.interface.js';
import { OFFER_GOODS, OFFER_IMAGES_COUNT } from './offer.dto.js';

export type DocumentOffer = OfferInterface &
  Document & {
    _id: Types.ObjectId;
  };

export const offerSchema = new Schema<DocumentOffer>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId(),
    },
    title: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ['apartment', 'house', 'room', 'hotel'],
    },
    price: {
      type: Number,
      required: true,
      min: 100,
      max: 100000,
    },
    previewImage: {
      type: String,
      required: true,
    },
    cityName: {
      type: String,
      required: true,
      enum: [
        'Paris',
        'Cologne',
        'Brussels',
        'Amsterdam',
        'Hamburg',
        'Dusseldorf',
      ],
      index: true,
    },
    cityLatitude: { type: Number, required: true },
    cityLongitude: { type: Number, required: true },
    cityZoom: { type: Number, required: true },
    offerLatitude: { type: Number, required: true },
    offerLongitude: { type: Number, required: true },
    offerZoom: { type: Number, required: true },
    isPremium: { type: Boolean, default: false },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 1024,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    offerGoods: {
      type: [String],
      required: true,
      enum: OFFER_GOODS,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length === OFFER_IMAGES_COUNT,
        message: `There must be exactly ${OFFER_IMAGES_COUNT} images`,
      },
    },
    maxAdults: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    id: false,
    timestamps: true,
    collection: 'offers',
    toJSON: {
      transform: (_doc, ret) => {
        const result = ret as Record<string, unknown>;
        delete result._id;
        delete result.__v;
        const { id, ...rest } = result;
        return { id, ...rest };
      },
    },
  },
);

export const OfferModel: Model<DocumentOffer> = model<DocumentOffer>(
  'Offer',
  offerSchema,
);
