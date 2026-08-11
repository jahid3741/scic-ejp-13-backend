import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createBookingValidationSchema,
  updateBookingValidationSchema,
  getBookingsQuerySchema,
} from '../services/booking/booking.validation.js';
import { bookingController } from '../services/booking/booking.controller.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validateRequest(createBookingValidationSchema),
  bookingController.createBooking
);

router.get(
  '/',
  authMiddleware,
  validateRequest(getBookingsQuerySchema, 'query'),
  bookingController.getAllBookings
);

router.get(
  '/:id',
  authMiddleware,
  bookingController.getBookingById
);

router.patch(
  '/:id',
  authMiddleware,
  validateRequest(updateBookingValidationSchema),
  bookingController.updateBooking
);

router.delete(
  '/:id',
  authMiddleware,
  bookingController.deleteBooking
);

export const bookingRoutes = router;
