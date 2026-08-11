import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateUserValidationSchema } from '../services/user/user.validation.js';
import { userController } from '../services/user/user.controller.js';

const router = Router();

router.get('/', authMiddleware, authorize(UserRole.ADMIN), userController.getAllUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.patch('/:id', authMiddleware, validateRequest(updateUserValidationSchema), userController.updateUser);
router.delete('/:id', authMiddleware, authorize(UserRole.ADMIN), userController.deleteUser);

export const userRoutes = router;
