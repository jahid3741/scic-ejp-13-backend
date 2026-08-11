import { UserRole } from '@prisma/client';

export type TAuthUser = {
  userId: string;
  role: UserRole;
  email?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TAuthUser;
    }
  }
}
