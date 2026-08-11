import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
} from '../services/category/category.validation.js';
import { categoryController } from '../services/category/category.controller.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  authorize(UserRole.ADMIN),
  validateRequest(createCategoryValidationSchema),
  categoryController.createCategory
);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.patch(
  '/:id',
  authMiddleware,
  authorize(UserRole.ADMIN),
  validateRequest(updateCategoryValidationSchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  authorize(UserRole.ADMIN),
  categoryController.deleteCategory
);

export const categoryRoutes = router;
