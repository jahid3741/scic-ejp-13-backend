import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const updateUserValidationSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
});
