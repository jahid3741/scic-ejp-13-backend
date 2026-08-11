import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/appError.js';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized access'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'Forbidden: You do not have permission to perform this action')
      );
    }

    next();
  };
};
