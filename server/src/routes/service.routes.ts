import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createServiceValidationSchema,
  updateServiceValidationSchema,
  getServicesQuerySchema,
} from '../services/service/service.validation.js';
import { serviceController } from '../services/service/service.controller.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  authorize(UserRole.ADMIN),
  validateRequest(createServiceValidationSchema),
  serviceController.createService
);

router.get(
  '/',
  optionalAuthMiddleware,
  validateRequest(getServicesQuerySchema, 'query'),
  serviceController.getAllServices
);

router.get(
  '/:id',
  optionalAuthMiddleware,
  serviceController.getServiceById
);

router.patch(
  '/:id',
  authMiddleware,
  authorize(UserRole.ADMIN),
  validateRequest(updateServiceValidationSchema),
  serviceController.updateService
);

router.delete(
  '/:id',
  authMiddleware,
  authorize(UserRole.ADMIN),
  serviceController.deleteService
);

export const serviceRoutes = router;
