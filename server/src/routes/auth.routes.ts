import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  registerValidationSchema,
  loginValidationSchema,
} from '../services/auth/auth.validation.js';
import { authController } from '../services/auth/auth.controller.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerValidationSchema),
  authController.register
);
router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginValidationSchema),
  authController.login
);
router.get('/me', authMiddleware, authController.getMe);

export const authRoutes = router;
