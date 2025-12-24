import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { verifyAccessToken, TokenPayload } from '../utils/auth';
import { redisClient, isRedisConnected } from '../db/redis';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error: ApiError = new Error('Unauthorized - Missing or invalid authorization header');
    error.statusCode = 401;
    error.code = 'MISSING_TOKEN';
    return next(error);
  }

  const token = authHeader.substring(7);

  try {

    const decoded = verifyAccessToken(token);

    if (isRedisConnected()) {
      try {
        const blacklisted = await redisClient.get(`blacklist:${token}`);
        if (blacklisted) {
          const error: ApiError = new Error('Token has been revoked');
          error.statusCode = 401;
          error.code = 'TOKEN_REVOKED';
          return next(error);
        }
      } catch (redisError) {

        logger.warn('Redis blacklist check failed', redisError);
      }
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    const err: ApiError = new Error('Invalid or expired token');
    err.statusCode = 401;
    err.code = 'INVALID_TOKEN';
    if (error.name === 'TokenExpiredError') {
      err.code = 'TOKEN_EXPIRED';
    }
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error: ApiError = new Error('Unauthorized');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error: ApiError = new Error('Forbidden');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

