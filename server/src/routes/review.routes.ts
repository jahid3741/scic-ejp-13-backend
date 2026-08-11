import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createReviewValidationSchema,
  updateReviewValidationSchema,
  getReviewsQuerySchema,
} from '../services/review/review.validation.js';
import { reviewController } from '../services/review/review.controller.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validateRequest(createReviewValidationSchema),
  reviewController.createReview
);

router.get(
  '/',
  validateRequest(getReviewsQuerySchema, 'query'),
  reviewController.getAllReviews
);

router.get(
  '/:id',
  reviewController.getReviewById
);

router.patch(
  '/:id',
  authMiddleware,
  validateRequest(updateReviewValidationSchema),
  reviewController.updateReview
);

router.delete(
  '/:id',
  authMiddleware,
  reviewController.deleteReview
);

export const reviewRoutes = router;
