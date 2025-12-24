import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { createRateLimiter } from './middleware/rateLimiter';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { alertsRouter } from './routes/alerts';
import { healthRouter } from './routes/health';
import { queueRouter } from './routes/queue';
import { auditRouter } from './routes/audit';
import { usersRouter } from './routes/users';
import { batchJobsRouter } from './routes/batchJobs';
import { rulesRouter } from './routes/rules';
import { closePostgres, getPostgresStatus, isPostgresConnected } from './db/postgres';
import { closeRedis, safeRedisPing, isRedisConnected } from './db/redis';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(passport.initialize());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('user-agent') });
  next();
});

app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

const monitoringLimiter = RATE_LIMIT_ENABLED
  ? createRateLimiter({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MONITORING_MAX || '60'),
      message: 'Too many requests from this IP, please try again later.'
    })
  : (req: Request, res: Response, next: NextFunction) => next();

const apiLimiter = RATE_LIMIT_ENABLED
  ? createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_API_MAX || '1000'),
      message: 'Too many requests from this IP, please try again later.'
    })
  : (req: Request, res: Response, next: NextFunction) => next();

const authLimiter = RATE_LIMIT_ENABLED
  ? createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '100'), // Stricter for auth
      message: 'Too many authentication requests. Please try again later.',
      keyGenerator: (req: Request) => {

        const email = req.body?.email || req.query?.email;
        return email ? `auth:${email}` : req.ip || 'unknown';
      }
    })
  : (req: Request, res: Response, next: NextFunction) => next();

app.use('/api/v1/queue', monitoringLimiter, queueRouter);

app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/transactions', apiLimiter, transactionsRouter);
app.use('/api/v1/alerts', apiLimiter, alertsRouter);
app.use('/api/v1/audit', apiLimiter, auditRouter);
app.use('/api/v1/users', apiLimiter, usersRouter);
app.use('/api/v1/batch-jobs', apiLimiter, batchJobsRouter);
app.use('/api/v1/rules', apiLimiter, rulesRouter);

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    service: 'PayFlow API Gateway',
    version: '1.0.0',
    status: 'operational'
  });
});

app.use(errorHandler);

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  try {
    await closePostgres();
  } catch (error) {
    logger.warn('Error closing PostgreSQL connection:', error);
  }
  try {
    await closeRedis();
  } catch (error) {
    logger.warn('Error closing Redis connection:', error);
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const startServer = async () => {
  try {

    const postgresStatus = getPostgresStatus();
    if (isPostgresConnected()) {
      logger.info('PostgreSQL connection established', {
        totalConnections: postgresStatus.totalConnections,
        idleConnections: postgresStatus.idleConnections
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        logger.error('PostgreSQL connection failed - required in production');
        process.exit(1);
      } else {
        logger.warn('PostgreSQL connection failed - continuing without database', {
          error: postgresStatus.lastError
        });
      }
    }

    const redisConnected = await safeRedisPing();
    if (redisConnected) {
      logger.info('Redis connection established');
    } else {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Redis connection failed - cache unavailable in production');
      } else {
        logger.warn('Redis connection not available - continuing without cache');
      }
    }

    app.listen(PORT, () => {
      logger.info(`PaySignal API Gateway listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Health check available at /health');
      logger.info('Liveness probe at /health/liveness');
      logger.info('Readiness probe at /health/readiness');
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Running in development mode - PostgreSQL and Redis are optional');
      }
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

