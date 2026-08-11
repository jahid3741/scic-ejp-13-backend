import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 30, // Max 30 requests per IP per 15 mins for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    errorSources: [
      {
        path: '',
        message: 'Rate limit exceeded',
      },
    ],
  },
});
