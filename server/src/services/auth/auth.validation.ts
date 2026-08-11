import { z } from 'zod';

export const registerValidationSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginValidationSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});
