import { Request, Response, NextFunction } from 'express';
import { isRedisConnected, safeRedisGet, safeRedisSet } from '../db/redis';
import { logger } from '../utils/logger';
import { ApiError } from './errorHandler';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

const memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => req.ip || 'unknown'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      let count: number;
      let resetTime: number;

      if (isRedisConnected()) {

        try {
          const redisKey = `${key}:${Math.floor(now / windowMs)}`;
          const current = await safeRedisGet(redisKey);
          
          if (current) {
            const data = JSON.parse(current);
            count = data.count;
            resetTime = data.resetTime;
          } else {
            count = 0;
            resetTime = now + windowMs;
          }

          count++;
          
          await safeRedisSet(
            redisKey,
            JSON.stringify({ count, resetTime }),
            Math.ceil(windowMs / 1000) // TTL in seconds
          );
        } catch (redisError: any) {
          logger.warn('Redis rate limit check failed, falling back to memory', {
            error: redisError.message
          });

          throw redisError;
        }
      } else {

        const stored = memoryStore.get(key);
        
        if (stored && stored.resetTime > now) {
          count = stored.count + 1;
          resetTime = stored.resetTime;
        } else {
          count = 1;
          resetTime = now + windowMs;
        }
        
        memoryStore.set(key, { count, resetTime });

        if (memoryStore.size > 10000) {
          for (const [k, v] of memoryStore.entries()) {
            if (v.resetTime <= now) {
              memoryStore.delete(k);
            }
          }
        }
      }

      const remaining = Math.max(0, max - count);
      const reset = Math.ceil((resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
      res.setHeader('Retry-After', reset.toString());

      if (count > max) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          count,
          max,
          key: keyGenerator(req)
        });

        const error: ApiError = new Error(message);
        error.statusCode = 429;
        error.code = 'RATE_LIMIT_EXCEEDED';
        return next(error);
      }

      const originalSend = res.send;
      res.send = function (body: any) {
        const statusCode = res.statusCode;
        
        if (skipSuccessfulRequests && statusCode < 400) {

        } else if (skipFailedRequests && statusCode >= 400) {

        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error: any) {

      logger.error('Rate limiter error', {
        error: error.message,
        key: keyGenerator(req)
      });

      next();
    }
  };
};

export const createMemoryRateLimiter = (options: RateLimitOptions) => {
  return createRateLimiter(options);
};

