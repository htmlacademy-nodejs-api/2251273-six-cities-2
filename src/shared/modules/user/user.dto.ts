import { z } from 'zod';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeOptionalString = (value: unknown): unknown => {
  if (value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      return undefined;
    }

    return trimmed;
  }

  return value;
};

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(15, 'Name must be at most 15 characters'),

  email: z.preprocess(
    trimString,
    z.email({
      error: 'Invalid email format',
    }),
  ),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(12, 'Password must be at most 12 characters'),

  avatarUrl: z.preprocess(
    normalizeOptionalString,
    z
      .string()
      .max(2048, 'Avatar URL is too long')
      .optional(),
  ),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
