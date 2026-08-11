import { z } from 'zod';

export const createCategoryValidationSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Name cannot be empty' }),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  icon: z
    .string()
    .transform((val) => val.trim())
    .optional(),
});

export const updateCategoryValidationSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Name cannot be empty' })
    .optional(),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  icon: z
    .string()
    .transform((val) => val.trim())
    .optional(),
});
