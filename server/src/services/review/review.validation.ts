import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  serviceId: z
    .string({ message: 'Service ID is required' })
    .uuid('Service ID must be a valid UUID'),
  rating: z
    .number({ message: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length <= 1000, { message: 'Comment must not exceed 1000 characters' })
    .optional(),
});

export const updateReviewValidationSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .optional(),
  comment: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length <= 1000, { message: 'Comment must not exceed 1000 characters' })
    .optional(),
});

export const getReviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  serviceId: z.string().uuid('Invalid Service ID format').optional(),
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1 && val <= 5), {
      message: 'Rating filter must be between 1 and 5',
    }),
  search: z.string().optional(),
  sortBy: z.enum(['rating', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
