import { Router, Request, Response, NextFunction } from 'express';
import { safeQuery, getPostgresStatus, isPostgresConnected } from '../db/postgres';
import { safeRedisPing, getRedisStatus, isRedisConnected } from '../db/redis';
import { logger } from '../utils/logger';

export const healthRouter = Router();

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

healthRouter.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: Record<string, { 
    status: 'healthy' | 'unhealthy' | 'degraded'; 
    message?: string;
    responseTime?: number;
    details?: any;
  }> = {};

  const postgresStart = Date.now();
  try {
    const result = await Promise.race([
      safeQuery('SELECT NOW(), version(), current_database()'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL health check timeout')), HEALTH_CHECK_TIMEOUT)
      )
    ]);
    
    const postgresStatus = getPostgresStatus();
    checks.postgres = {
      status: 'healthy',
      responseTime: Date.now() - postgresStart,
      details: {
        version: result.rows[0]?.version?.split(' ')[0] || 'unknown',
        database: result.rows[0]?.current_database || 'unknown',
        connections: {
          total: postgresStatus.totalConnections,
          idle: postgresStatus.idleConnections,
          waiting: postgresStatus.waitingCount
        }
      }
    };
  } catch (error: any) {
    const responseTime = Date.now() - postgresStart;
    let message = 'Connection failed';
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'unhealthy';
    
    if (error.code === 'ECONNREFUSED') {
      message = 'Connection refused - PostgreSQL may not be running';
      status = 'unhealthy';
    } else if (error.code === 'ENOTFOUND') {
      message = 'Host not found';
      status = 'unhealthy';
    } else if (error.code === '28P01') {
      message = 'Authentication failed';
      status = 'unhealthy';
    } else if (error.code === '3D000') {
      message = 'Database does not exist';
      status = 'unhealthy';
    } else if (error.message?.includes('timeout')) {
      message = 'Health check timeout';
      status = 'unhealthy';
    } else {
      message = error.message || 'Connection failed';
      status = 'unhealthy';
    }
    
    checks.postgres = {
      status,
      message,
      responseTime
    };
  }

  const redisStart = Date.now();
  try {
    const isConnected = await safeRedisPing(2000);
    const redisStatus = getRedisStatus();
    
    if (isConnected) {
      checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
        details: {
          isOpen: redisStatus.isOpen,
          reconnectAttempts: redisStatus.reconnectAttempts
        }
      };
    } else {
      checks.redis = {
        status: 'degraded',
        message: 'Redis client not connected - cache unavailable',
        responseTime: Date.now() - redisStart,
        details: {
          isOpen: redisStatus.isOpen,
          reconnectAttempts: redisStatus.reconnectAttempts,
          lastError: redisStatus.lastError
        }
      };
    }
  } catch (error: any) {
    const redisStatus = getRedisStatus();
    checks.redis = {
      status: 'degraded',
      message: error.message || 'Redis connection failed',
      responseTime: Date.now() - redisStart,
      details: {
        isOpen: redisStatus.isOpen,
        reconnectAttempts: redisStatus.reconnectAttempts,
        lastError: redisStatus.lastError
      }
    };
  }

  const criticalServices = ['postgres'];
  const optionalServices = ['redis'];
  
  const criticalHealthy = criticalServices.every(
    service => checks[service]?.status === 'healthy'
  );
  
  const optionalHealthy = optionalServices.every(
    service => checks[service]?.status === 'healthy' || checks[service]?.status === 'degraded'
  );
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (criticalHealthy && optionalHealthy) {
    status = 'healthy';
  } else if (criticalHealthy) {
    status = 'degraded'; // Critical services OK, but optional services degraded
  } else {
    status = 'unhealthy'; // Critical services down
  }

  const totalTime = Date.now() - startTime;

  res.json({
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    responseTime: totalTime,
    checks
  });
});

healthRouter.get('/liveness', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

healthRouter.get('/readiness', async (req: Request, res: Response) => {
  const checks: Record<string, boolean> = {};

  checks.postgres = isPostgresConnected();

  checks.redis = isRedisConnected();
  
  const ready = checks.postgres; // PostgreSQL is required
  
  res.status(ready ? 200 : 503).json({
    ready,
    timestamp: new Date().toISOString(),
    checks
  });
});

