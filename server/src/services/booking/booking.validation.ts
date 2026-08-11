import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingValidationSchema = z.object({
  serviceId: z
    .string({ message: 'Service ID is required' })
    .uuid('Service ID must be a valid UUID'),
  bookingDate: z
    .string({ message: 'Booking date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid ISO date string' })
    .refine((val) => new Date(val) > new Date(), { message: 'Booking date must be in the future' }),
  notes: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length <= 500, { message: 'Notes must not exceed 500 characters' })
    .optional(),
});

export const updateBookingValidationSchema = z.object({
  bookingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid ISO date string' })
    .refine((val) => new Date(val) > new Date(), { message: 'Booking date must be in the future' })
    .optional(),
  notes: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length <= 500, { message: 'Notes must not exceed 500 characters' })
    .optional(),
  status: z
    .enum([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    ])
    .optional(),
  serviceId: z.string().uuid('Service ID must be a valid UUID').optional(),
});

export const getBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z
    .enum([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    ])
    .optional(),
  serviceId: z.string().uuid('Invalid Service ID format').optional(),
  sortBy: z.enum(['bookingDate', 'totalAmount', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
