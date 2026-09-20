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

export const createAuthSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z
    .string()
    .min(10, 'Token is too short')
    .max(2048, 'Token is too long'),
  expiresAt: z.coerce.date({
    error: 'Invalid expiresAt date format',
  }),
  userAgent: z.preprocess(
    normalizeOptionalString,
    z.string().max(1024, 'UserAgent is too long').optional(),
  ),
  ip: z.preprocess(
    normalizeOptionalString,
    z.string().max(45, 'IP is too long').optional(),
  ),
});
export type CreateAuthDto = z.infer<typeof createAuthSchema>;

export const loginSchema = z.object({
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
});
export type LoginDto = z.infer<typeof loginSchema>;
