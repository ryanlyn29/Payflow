import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/postgres';
import { redisClient, isRedisConnected } from '../db/redis';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  generateUserId,
  generateTokenId,
  generateToken,
  hashToken,
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload
} from '../utils/auth';
import {
  sendEmail,
  generateVerificationEmail,
  generatePasswordResetEmail
} from '../utils/email';

export const authRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BASE_URL = process.env.BASE_URL || FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/v1/auth/oauth/google/callback`
      },
      async (accessToken: string, refreshToken: string | undefined, profile: any, done: (error: any, user?: any) => void) => {
        try {
          const providerUserId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const name = profile.displayName || profile.name?.givenName || 'User';

          const oauthResult = await db.query(
            'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
            ['google', providerUserId]
          );

          if (oauthResult.rows.length > 0) {

            const userResult = await db.query(
              'SELECT * FROM users WHERE id = $1',
              [oauthResult.rows[0].user_id]
            );
            if (userResult.rows.length > 0) {
              return done(null, userResult.rows[0]);
            }
          }

          const userResult = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          let userId: string;

          if (userResult.rows.length > 0) {

            userId = userResult.rows[0].id;
            await db.query(
              `UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1`,
              [userId]
            );

            const oauthId = generateTokenId();
            await db.query(
              `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email, access_token, refresh_token, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
               ON CONFLICT (provider, provider_user_id) 
               DO UPDATE SET access_token = $6, refresh_token = $7, updated_at = NOW()`,
              [oauthId, userId, 'google', providerUserId, email, accessToken, refreshToken || null]
            );

            return done(null, userResult.rows[0]);
          }

          userId = generateUserId();
          const passwordHash = await hashPassword(generateToken()); // Random password for OAuth users
          const defaultPreferences = {
            theme: 'dark',
            density: 'comfortable',
            notifications_enabled: true,
            default_region: 'us-east-1'
          };

          const newUserResult = await db.query(
            `INSERT INTO users (id, email, name, role, password_hash, preferences, email_verified, email_verified_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW(), NOW())
             RETURNING *`,
            [userId, email, name, 'operator', passwordHash, JSON.stringify(defaultPreferences)]
          );

          const oauthId = generateTokenId();
          await db.query(
            `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email, access_token, refresh_token, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [oauthId, userId, 'google', providerUserId, email, accessToken, refreshToken || null]
          );

          return done(null, newUserResult.rows[0]);
        } catch (error: any) {
          logger.error('Google OAuth callback error', error);
          return done(error, null);
        }
      }
    )
  );
}

function getClientInfo(req: Request): { ip: string; userAgent: string } {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             req.socket.remoteAddress || 
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ip: ip.trim(), userAgent };
}

async function requireEmailVerification(userId: string): Promise<boolean> {
  const result = await db.query(
    'SELECT email_verified FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.email_verified === true;
}

authRouter.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('name').trim().isLength({ min: 2, max: 255 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error('Validation failed');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.message = errors.array().map(e => e.msg).join(', ');
        return next(error);
      }

      const { email, password, name } = req.body;

      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        const error: ApiError = new Error('User with this email already exists');
        error.statusCode = 409;
        error.code = 'USER_EXISTS';
        return next(error);
      }

      const userId = generateUserId();
      const passwordHash = await hashPassword(password);
      const defaultPreferences = {
        theme: 'dark',
        density: 'comfortable',
        notifications_enabled: true,
        default_region: 'us-east-1'
      };

      await db.query(
        `INSERT INTO users (id, email, name, role, password_hash, preferences, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, email, name, 'read_only', passwordHash, JSON.stringify(defaultPreferences), false]
      );

      const verificationToken = generateToken();
      const tokenHash = await hashToken(verificationToken);
      const tokenId = generateTokenId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [tokenId, userId, tokenHash, expiresAt]
      );

      try {
        const emailOptions = generateVerificationEmail(email, verificationToken, BASE_URL);
        await sendEmail(emailOptions);
      } catch (emailError: any) {
        logger.error('Failed to send verification email', emailError);

      }

      logger.info('User signed up', { userId, email });

      res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: userId,
          email,
          name,
          role: 'read_only',
          email_verified: false
        }
      });
    } catch (error: any) {
      logger.error('Signup error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
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

      const { email, password } = req.body;
      const { ip, userAgent } = getClientInfo(req);

      const result = await db.query(
        `SELECT id, email, name, role, password_hash, preferences, email_verified 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        const error: ApiError = new Error('Invalid credentials');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        return next(error);
      }

      const user = result.rows[0];

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        const error: ApiError = new Error('Invalid credentials');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        return next(error);
      }

      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const refreshTokenId = generateTokenId();
      const refreshTokenHash = await hashToken(refreshToken);
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const familyId = generateTokenId(); // For token rotation

      await db.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent, family_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [refreshTokenId, user.id, refreshTokenHash, refreshExpiresAt, ip, userAgent, familyId]
      );

      const sessionId = generateTokenId();
      await db.query(
        `INSERT INTO user_sessions (id, user_id, refresh_token_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, user.id, refreshTokenId, ip, userAgent]
      );

      if (isRedisConnected()) {
        try {
          await redisClient.setEx(
            `session:${sessionId}`,
            7 * 24 * 60 * 60, // 7 days
            JSON.stringify({ userId: user.id, refreshTokenId })
          );
        } catch (redisError) {
          logger.warn('Failed to store session in Redis', redisError);
        }
      }

      logger.info('User logged in', { userId: user.id, email: user.email });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          email_verified: user.email_verified,
          preferences: user.preferences || {
            theme: 'dark',
            density: 'comfortable',
            notifications_enabled: true,
            default_region: 'us-east-1'
          }
        },
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      logger.error('Login error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/refresh',
  [
    body('refreshToken').notEmpty()
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

      const { refreshToken } = req.body;

      let payload: TokenPayload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (error: any) {
        const err: ApiError = new Error('Invalid or expired refresh token');
        err.statusCode = 401;
        err.code = 'INVALID_REFRESH_TOKEN';
        return next(err);
      }

      const tokenHash = await hashToken(refreshToken);
      const tokenResult = await db.query(
        `SELECT id, user_id, expires_at, revoked_at, family_id 
         FROM refresh_tokens 
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0 || new Date(tokenResult.rows[0].expires_at) < new Date()) {
        const error: ApiError = new Error('Invalid or expired refresh token');
        error.statusCode = 401;
        error.code = 'INVALID_REFRESH_TOKEN';
        return next(error);
      }

      const tokenRecord = tokenResult.rows[0];

      const userResult = await db.query(
        `SELECT id, email, role FROM users WHERE id = $1`,
        [payload.id]
      );

      if (userResult.rows.length === 0) {
        const error: ApiError = new Error('User not found');
        error.statusCode = 401;
        error.code = 'USER_NOT_FOUND';
        return next(error);
      }

      const newAccessToken = generateAccessToken(payload);

      logger.info('Access token refreshed', { userId: payload.id });

      res.json({
        accessToken: newAccessToken
      });
    } catch (error: any) {
      logger.error('Token refresh error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/logout',
  [
    body('refreshToken').notEmpty()
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

      const { refreshToken } = req.body;
      const tokenHash = await hashToken(refreshToken);

      await db.query(
        `UPDATE refresh_tokens 
         SET revoked_at = NOW() 
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
      );

      const sessionResult = await db.query(
        `SELECT id FROM user_sessions WHERE refresh_token_id IN (
          SELECT id FROM refresh_tokens WHERE token_hash = $1
        )`,
        [tokenHash]
      );

      for (const session of sessionResult.rows) {

        if (isRedisConnected()) {
          try {
            await redisClient.del(`session:${session.id}`);
          } catch (redisError) {

          }
        }
      }

      logger.info('User logged out', { tokenHash: tokenHash.substring(0, 8) + '...' });

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      logger.error('Logout error', error);
      next(error);
    }
  }
);

authRouter.get(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        const error: ApiError = new Error('Verification token is required');
        error.statusCode = 400;
        error.code = 'MISSING_TOKEN';
        return next(error);
      }

      const tokenHash = await hashToken(token);
      const tokenResult = await db.query(
        `SELECT id, user_id, expires_at, verified_at 
         FROM email_verification_tokens 
         WHERE token_hash = $1`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        const error: ApiError = new Error('Invalid verification token');
        error.statusCode = 400;
        error.code = 'INVALID_TOKEN';
        return next(error);
      }

      const tokenRecord = tokenResult.rows[0];

      if (tokenRecord.verified_at) {
        const error: ApiError = new Error('Email already verified');
        error.statusCode = 400;
        error.code = 'ALREADY_VERIFIED';
        return next(error);
      }

      if (new Date(tokenRecord.expires_at) < new Date()) {
        const error: ApiError = new Error('Verification token has expired');
        error.statusCode = 400;
        error.code = 'TOKEN_EXPIRED';
        return next(error);
      }

      await db.query(
        `UPDATE email_verification_tokens 
         SET verified_at = NOW() 
         WHERE id = $1`,
        [tokenRecord.id]
      );

      await db.query(
        `UPDATE users 
         SET email_verified = TRUE, email_verified_at = NOW() 
         WHERE id = $1`,
        [tokenRecord.user_id]
      );

      logger.info('Email verified', { userId: tokenRecord.user_id });

      res.json({ 
        message: 'Email verified successfully',
        verified: true
      });
    } catch (error: any) {
      logger.error('Email verification error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/resend-verification',
  [
    body('email').isEmail().normalizeEmail()
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

      const { email } = req.body;

      const userResult = await db.query(
        'SELECT id, email, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {

        res.json({ 
          message: 'If an account exists with this email, a verification link has been sent.'
        });
        return;
      }

      const user = userResult.rows[0];

      if (user.email_verified) {
        const error: ApiError = new Error('Email is already verified');
        error.statusCode = 400;
        error.code = 'ALREADY_VERIFIED';
        return next(error);
      }

      await db.query(
        `UPDATE email_verification_tokens 
         SET verified_at = NOW() 
         WHERE user_id = $1 AND verified_at IS NULL`,
        [user.id]
      );

      const verificationToken = generateToken();
      const tokenHash = await hashToken(verificationToken);
      const tokenId = generateTokenId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [tokenId, user.id, tokenHash, expiresAt]
      );

      try {
        const emailOptions = generateVerificationEmail(email, verificationToken, BASE_URL);
        await sendEmail(emailOptions);
      } catch (emailError: any) {
        logger.error('Failed to send verification email', emailError);
        const error: ApiError = new Error('Failed to send verification email');
        error.statusCode = 500;
        error.code = 'EMAIL_SEND_FAILED';
        return next(error);
      }

      logger.info('Verification email resent', { userId: user.id, email });

      res.json({ 
        message: 'Verification email sent successfully'
      });
    } catch (error: any) {
      logger.error('Resend verification error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
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

      const { email } = req.body;

      const userResult = await db.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        res.json({ 
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
        return;
      }

      const user = userResult.rows[0];

      await db.query(
        `UPDATE password_reset_tokens 
         SET used_at = NOW() 
         WHERE user_id = $1 AND used_at IS NULL`,
        [user.id]
      );

      const resetToken = generateToken();
      const tokenHash = await hashToken(resetToken);
      const tokenId = generateTokenId();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [tokenId, user.id, tokenHash, expiresAt]
      );

      try {
        const emailOptions = generatePasswordResetEmail(email, resetToken, BASE_URL);
        await sendEmail(emailOptions);
      } catch (emailError: any) {
        logger.error('Failed to send password reset email', emailError);
        const error: ApiError = new Error('Failed to send password reset email');
        error.statusCode = 500;
        error.code = 'EMAIL_SEND_FAILED';
        return next(error);
      }

      logger.info('Password reset requested', { userId: user.id, email });

      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (error: any) {
      logger.error('Forgot password error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error('Validation failed');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.message = errors.array().map(e => e.msg).join(', ');
        return next(error);
      }

      const { token, password } = req.body;

      const tokenHash = await hashToken(token);
      const tokenResult = await db.query(
        `SELECT id, user_id, expires_at, used_at 
         FROM password_reset_tokens 
         WHERE token_hash = $1`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        const error: ApiError = new Error('Invalid reset token');
        error.statusCode = 400;
        error.code = 'INVALID_TOKEN';
        return next(error);
      }

      const tokenRecord = tokenResult.rows[0];

      if (tokenRecord.used_at) {
        const error: ApiError = new Error('Reset token has already been used');
        error.statusCode = 400;
        error.code = 'TOKEN_USED';
        return next(error);
      }

      if (new Date(tokenRecord.expires_at) < new Date()) {
        const error: ApiError = new Error('Reset token has expired');
        error.statusCode = 400;
        error.code = 'TOKEN_EXPIRED';
        return next(error);
      }

      const passwordHash = await hashPassword(password);
      await db.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW() 
         WHERE id = $2`,
        [passwordHash, tokenRecord.user_id]
      );

      await db.query(
        `UPDATE password_reset_tokens 
         SET used_at = NOW() 
         WHERE id = $1`,
        [tokenRecord.id]
      );

      await db.query(
        `UPDATE refresh_tokens 
         SET revoked_at = NOW() 
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [tokenRecord.user_id]
      );

      logger.info('Password reset completed', { userId: tokenRecord.user_id });

      res.json({ 
        message: 'Password reset successfully. Please log in with your new password.'
      });
    } catch (error: any) {
      logger.error('Reset password error', error);
      next(error);
    }
  }
);

authRouter.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error('Validation failed');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.message = errors.array().map(e => e.msg).join(', ');
        return next(error);
      }

      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) {
        const error: ApiError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { currentPassword, newPassword } = req.body;

      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        const error: ApiError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        return next(error);
      }

      const isValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
      if (!isValid) {
        const error: ApiError = new Error('Current password is incorrect');
        error.statusCode = 401;
        error.code = 'INVALID_PASSWORD';
        return next(error);
      }

      const newPasswordHash = await hashPassword(newPassword);
      await db.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW() 
         WHERE id = $2`,
        [newPasswordHash, userId]
      );

      await db.query(
        `UPDATE refresh_tokens 
         SET revoked_at = NOW() 
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );

      logger.info('Password changed', { userId });

      res.json({ 
        message: 'Password changed successfully. Please log in again.'
      });
    } catch (error: any) {
      logger.error('Change password error', error);
      next(error);
    }
  }
);

authRouter.get('/oauth/google', (req: Request, res: Response, next: NextFunction) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const error: ApiError = new Error('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    error.statusCode = 500;
    error.code = 'OAUTH_NOT_CONFIGURED';
    return next(error);
  }

  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

authRouter.get('/oauth/google/callback', (req: Request, res: Response, next: NextFunction) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const error: ApiError = new Error('Google OAuth not configured');
    error.statusCode = 500;
    error.code = 'OAUTH_NOT_CONFIGURED';
    return next(error);
  }

  passport.authenticate('google', { session: false }, async (err: any, user: any) => {
    try {
      if (err) {
        logger.error('Google OAuth authentication error', err);
        const error: ApiError = new Error('Google OAuth authentication failed');
        error.statusCode = 401;
        error.code = 'OAUTH_AUTH_FAILED';
        return next(error);
      }

      if (!user) {
        const error: ApiError = new Error('Google OAuth user not found');
        error.statusCode = 404;
        error.code = 'OAUTH_USER_NOT_FOUND';
        return next(error);
      }

      const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role || 'operator' });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role || 'operator' });

      const tokenId = generateTokenId();
      const tokenHash = await hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET token_hash = $3, expires_at = $4, created_at = NOW()`,
        [tokenId, user.id, tokenHash, expiresAt]
      );

      if (isRedisConnected()) {
        const clientInfo = getClientInfo(req);
        await redisClient.setEx(
          `session:${user.id}`,
          7 * 24 * 60 * 60, // 7 days
          JSON.stringify({
            userId: user.id,
            email: user.email,
            ip: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            loginMethod: 'google_oauth',
            createdAt: new Date().toISOString()
          })
        );
      }

      const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      redirectUrl.searchParams.set('provider', 'google');

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Google OAuth callback processing error', error);
      next(error);
    }
  })(req, res, next);
});

authRouter.get('/oauth/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const error: ApiError = new Error('GitHub OAuth not yet implemented. Install passport-github2');
    error.statusCode = 501;
    error.code = 'NOT_IMPLEMENTED';
    return next(error);
  } catch (error: any) {
    next(error);
  }
});

authRouter.get('/oauth/github/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const error: ApiError = new Error('GitHub OAuth not yet implemented');
    error.statusCode = 501;
    error.code = 'NOT_IMPLEMENTED';
    return next(error);
  } catch (error: any) {
    next(error);
  }
});

authRouter.post(
  '/oauth/unlink',
  authenticate,
  [
    body('provider').isIn(['google', 'github'])
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
      const userId = authReq.user?.id;
      if (!userId) {
        const error: ApiError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { provider } = req.body;

      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      const oauthResult = await db.query(
        'SELECT id FROM oauth_accounts WHERE user_id = $1',
        [userId]
      );

      if (oauthResult.rows.length <= 1 && !userResult.rows[0]?.password_hash) {
        const error: ApiError = new Error('Cannot unlink last authentication method');
        error.statusCode = 400;
        error.code = 'LAST_AUTH_METHOD';
        return next(error);
      }

      await db.query(
        'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      logger.info('OAuth account unlinked', { userId, provider });

      res.json({ 
        message: `${provider} account unlinked successfully`
      });
    } catch (error: any) {
      logger.error('Unlink OAuth error', error);
      next(error);
    }
  }
);

