import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { safeQuery } from '../db/postgres';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const result = await safeQuery(
      `SELECT 
        id, 
        email, 
        name, 
        role, 
        preferences,
        email_verified,
        email_verified_at,
        created_at,
        updated_at
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const user = result.rows[0];

    if (typeof user.preferences === 'string') {
      user.preferences = JSON.parse(user.preferences);
    }

    res.json({ user });
  } catch (error: any) {
    logger.error('Failed to fetch user profile', { error: error.message, userId: (req as AuthRequest).user?.id });
    next(error);
  }
});

usersRouter.patch('/me',
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('email').optional().isEmail().normalizeEmail()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error('Validation failed');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { name, email } = req.body;

      if (!name && !email) {
        const error: ApiError = new Error('At least one field (name or email) must be provided');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        params.push(name);
      }

      if (email) {

        const emailCheck = await safeQuery(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );
        if (emailCheck.rows.length > 0) {
          const error: ApiError = new Error('Email already in use');
          error.statusCode = 409;
          error.code = 'EMAIL_EXISTS';
          return next(error);
        }
        updates.push(`email = $${paramCount++}`);
        params.push(email);

        updates.push(`email_verified = FALSE`);
      }

      updates.push(`updated_at = NOW()`);
      params.push(userId);

      const result = await safeQuery(
        `UPDATE users 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, email, name, role, preferences, email_verified, created_at, updated_at`,
        params
      );

      if (result.rows.length === 0) {
        const error: ApiError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        return next(error);
      }

      const user = result.rows[0];
      if (typeof user.preferences === 'string') {
        user.preferences = JSON.parse(user.preferences);
      }

      logger.info('User profile updated', { userId, fields: { name, email } });

      res.json({ user });
    } catch (error: any) {
      logger.error('Failed to update user profile', { error: error.message, userId: (req as AuthRequest).user?.id });
      next(error);
    }
  }
);

usersRouter.patch('/me/preferences',
  [],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      let preferences = req.body.preferences || req.body;
      
      if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
        const error: ApiError = new Error('Preferences must be an object');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const allowedKeys = ['theme', 'density', 'notifications_enabled', 'default_region', 'timezone', 'language', 'onboarding_complete'];
      const invalidKeys = Object.keys(preferences).filter(key => !allowedKeys.includes(key));
      if (invalidKeys.length > 0) {
        const error: ApiError = new Error(`Invalid preference keys: ${invalidKeys.join(', ')}`);
        error.statusCode = 400;
        error.code = 'INVALID_PREFERENCES';
        return next(error);
      }

      const currentUser = await safeQuery(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );

      if (currentUser.rows.length === 0) {
        const error: ApiError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        return next(error);
      }

      const currentPrefs = typeof currentUser.rows[0].preferences === 'string'
        ? JSON.parse(currentUser.rows[0].preferences)
        : currentUser.rows[0].preferences || {};

      const mergedPreferences = { ...currentPrefs, ...preferences };

      const result = await safeQuery(
        `UPDATE users 
         SET preferences = $1::jsonb, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id, email, name, role, preferences, created_at, updated_at`,
        [JSON.stringify(mergedPreferences), userId]
      );

      const user = result.rows[0];
      user.preferences = mergedPreferences;

      logger.info('User preferences updated', { userId, preferences: Object.keys(preferences) });

      res.json({ user });
    } catch (error: any) {
      logger.error('Failed to update user preferences', { error: error.message, userId: (req as AuthRequest).user?.id });
      next(error);
    }
  }
);

usersRouter.get('/me/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const result = await safeQuery(
      `SELECT 
        s.id,
        s.ip_address,
        s.user_agent,
        s.last_active_at,
        s.created_at,
        rt.expires_at
       FROM user_sessions s
       JOIN refresh_tokens rt ON s.refresh_token_id = rt.id
       WHERE s.user_id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
       ORDER BY s.last_active_at DESC`,
      [userId]
    );

    res.json({ sessions: result.rows });
  } catch (error: any) {
    logger.error('Failed to fetch user sessions', { error: error.message, userId: (req as AuthRequest).user?.id });
    next(error);
  }
});

usersRouter.delete('/me/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { sessionId } = req.params;

    const sessionCheck = await safeQuery(
      'SELECT refresh_token_id FROM user_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      const error: ApiError = new Error('Session not found');
      error.statusCode = 404;
      error.code = 'SESSION_NOT_FOUND';
      return next(error);
    }

    await safeQuery(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [sessionCheck.rows[0].refresh_token_id]
    );

    logger.info('User session revoked', { userId, sessionId });

    res.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    logger.error('Failed to revoke session', { error: error.message, userId: (req as AuthRequest).user?.id });
    next(error);
  }
});

