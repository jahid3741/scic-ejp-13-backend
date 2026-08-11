import { z } from 'zod';
import { ServiceStatus } from '@prisma/client';

export const createServiceValidationSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Name cannot be empty' }),
  description: z
    .string({ message: 'Description is required' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Description cannot be empty' }),
  price: z
    .number({ message: 'Price must be a positive number' })
    .positive('Price must be greater than 0'),
  duration: z
    .number({ message: 'Duration must be a positive integer' })
    .int('Duration must be an integer')
    .positive('Duration must be greater than 0'),
  categoryId: z
    .string({ message: 'Category ID is required' })
    .uuid('Category ID must be a valid UUID'),
  status: z.enum([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE]).optional(),
});

export const updateServiceValidationSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Name cannot be empty' })
    .optional(),
  description: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Description cannot be empty' })
    .optional(),
  price: z.number().positive('Price must be greater than 0').optional(),
  duration: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be greater than 0')
    .optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  status: z.enum([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE]).optional(),
});

export const getServicesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  categoryId: z.string().uuid('Invalid Category ID format').optional(),
  status: z.enum([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'name', 'duration', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
