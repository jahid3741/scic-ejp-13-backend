import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import router from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { globalErrorHandler } from './middleware/error.middleware.js';

const app: Application = express();

// Security Headers
app.use(helmet());

// Logging Middleware (HTTP Request Logger)
const loggerFormat = config.env === 'development' ? 'dev' : 'combined';
app.use(morgan(loggerFormat));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic CORS Configuration
const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigin === '*' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin restriction: Request blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Application Routes
app.use('/api', router);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
