import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { categoryRoutes } from './category.routes.js';
import { serviceRoutes } from './service.routes.js';
import { bookingRoutes } from './booking.routes.js';
import { reviewRoutes } from './review.routes.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      data: {
        environment: config.env,
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unavailable: Database connection check failed',
      data: {
        environment: config.env,
        database: 'disconnected',
      },
    });
  }
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);

export default router;
