import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized access: Token missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(401, 'Unauthorized access: Token missing'));
  }

  try {
    const decoded = verifyToken<{ userId: string; role: UserRole }>(token);

    if (!decoded || !decoded.userId || !decoded.role) {
      return next(new AppError(401, 'Unauthorized access: Invalid token payload'));
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    return next(new AppError(401, 'Unauthorized access: Invalid or expired token'));
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = verifyToken<{ userId: string; role: UserRole }>(token);
        if (decoded && decoded.userId && decoded.role) {
          req.user = {
            userId: decoded.userId,
            role: decoded.role,
          };
        }
      } catch {
        // Ignore invalid token on optional auth routes
      }
    }
  }

  next();
};
