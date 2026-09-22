import { z } from 'zod';

export const OFFER_GOODS = [
  'Breakfast',
  'Air conditioning',
  'Laptop friendly workspace',
  'Baby seat',
  'Washer',
  'Towels',
  'Fridge',
] as const;

export type OfferGood = (typeof OFFER_GOODS)[number];

export const OFFER_IMAGES_COUNT = 6;

export const createOfferSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, 'Title must be at least 10 characters long')
    .max(100, 'Title must be at most 100 characters long'),

  type: z.enum(['apartment', 'house', 'room', 'hotel'] as const, {
    error: 'Invalid offer type',
  }),

  price: z
    .number({ error: 'Price must be a number' })
    .min(100, 'Price must be at least 100')
    .max(100000, 'Price must be at most 100000'),

  previewImage: z
    .string()
    .trim()
    .max(2048, 'Preview image URL is too long'),

  cityName: z.enum(
    ['Paris', 'Cologne', 'Brussels', 'Amsterdam', 'Hamburg', 'Dusseldorf'] as const,
    { error: 'Invalid city name' },
  ),

  cityLatitude: z.number({ error: 'City latitude must be a number' }),
  cityLongitude: z.number({ error: 'City longitude must be a number' }),
  cityZoom: z.number({ error: 'City zoom must be a number' }),

  offerLatitude: z.number({ error: 'Offer latitude must be a number' }),
  offerLongitude: z.number({ error: 'Offer longitude must be a number' }),
  offerZoom: z.number({ error: 'Offer zoom must be a number' }),

  isPremium: z.boolean().optional(),

  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters long')
    .max(1024, 'Description must be at most 1024 characters long'),

  bedrooms: z
    .number({ error: 'Bedrooms must be a number' })
    .int('Bedrooms must be an integer')
    .min(1, 'Bedrooms must be at least 1')
    .max(8, 'Bedrooms must be at most 8'),

  offerGoods: z
    .array(z.enum(OFFER_GOODS, { error: 'Unknown offer good' }))
    .min(1, 'At least one offer good is required'),

  images: z
    .array(z.string().trim().max(2048, 'Image URL is too long'))
    .length(OFFER_IMAGES_COUNT, `There must be exactly ${OFFER_IMAGES_COUNT} images`),

  maxAdults: z
    .number({ error: 'Max adults must be a number' })
    .int('Max adults must be an integer')
    .min(1, 'Max adults must be at least 1')
    .max(10, 'Max adults must be at most 10'),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export const updateOfferSchema = createOfferSchema.partial();
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;
