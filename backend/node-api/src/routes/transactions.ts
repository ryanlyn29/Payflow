import { Router, Request, Response, NextFunction } from 'express';
import { query, body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { safeQuery } from '../db/postgres';
import { safeRedisGet, safeRedisSet, safeRedisDel, isRedisConnected } from '../db/redis';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { generateTokenId } from '../utils/auth';
import crypto from 'crypto';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);

transactionsRouter.get(
  '/',
  [
    query('merchant_id').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error('Validation failed');
        error.statusCode = 400;
        return next(error);
      }

      const { merchant_id, limit = 50, offset = 0 } = req.query;
      const authReq = req as AuthRequest;

      if (isRedisConnected()) {
        const cacheKey = `transactions:${merchant_id || 'all'}:${limit}:${offset}`;
        const cached = await safeRedisGet(cacheKey);
        if (cached) {
          logger.debug('Cache hit for transactions', { cacheKey });
          return res.json(JSON.parse(cached));
        }
      }

      let queryText = `
        SELECT 
          payment_transaction_id,
          merchant_id,
          payer_id,
          amount,
          currency,
          current_state,
          created_at,
          updated_at,
          last_event_id,
          retry_count,
          failure_reason,
          metadata
        FROM payment_transactions
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (merchant_id) {
        queryText += ` AND merchant_id = $${paramCount++}`;
        params.push(merchant_id);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await safeQuery(queryText, params);

      const response = { transactions: result.rows };

      if (isRedisConnected()) {
        const cacheKey = `transactions:${merchant_id || 'all'}:${limit}:${offset}`;
        await safeRedisSet(cacheKey, JSON.stringify(response), 30);
      }

      res.json(response);
    } catch (error: any) {
      const { merchant_id, limit, offset } = req.query;
      logger.error('Failed to fetch transactions', {
        error: error.message,
        code: error.code,
        merchant_id: merchant_id || null,
        limit: limit || null,
        offset: offset || null
      });

      if (process.env.NODE_ENV === 'production') {
        const apiError: ApiError = new Error('Failed to fetch transactions');
        apiError.statusCode = 500;
        apiError.code = 'TRANSACTIONS_FETCH_FAILED';
        return next(apiError);
      }

      if (error.code === '42P01' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        logger.warn('Database unavailable in development, returning empty array', error.message);
        return res.json({ transactions: [] });
      }
      
      next(error);
    }
  }
);

transactionsRouter.post(
  '/',
  [
    body('merchant_id').notEmpty().withMessage('Merchant ID is required').isString().trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters').toUpperCase(),
    body('payer_id').optional().isString().trim(),
    body('current_state').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed']).withMessage('Invalid state'),
    body('metadata').optional().custom((value) => {
      if (value === undefined || value === null) return true;
      return typeof value === 'object' && !Array.isArray(value);
    }).withMessage('Metadata must be an object')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info('POST /transactions route hit', { 
      body: req.body,
      method: req.method,
      path: req.path 
    });
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error: ApiError = new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const { merchant_id, amount, currency = 'USD', payer_id, current_state = 'pending', metadata } = req.body;
      const authReq = req as AuthRequest;

      const transactionId = `txn_${crypto.randomBytes(16).toString('hex')}`;
      const eventId = generateTokenId();

      const amountInCents = Math.round(parseFloat(String(amount)) * 100);

      const normalizedMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) 
        ? metadata 
        : {};

      const insertResult = await safeQuery(
        `INSERT INTO payment_transactions (
          payment_transaction_id,
          merchant_id,
          payer_id,
          amount,
          currency,
          current_state,
          last_event_id,
          retry_count,
          metadata,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          transactionId,
          merchant_id,
          payer_id || null,
          amountInCents,
          currency.toUpperCase(),
          current_state,
          eventId,
          0,
          JSON.stringify(normalizedMetadata)
        ]
      );

      const transaction = insertResult.rows[0];

      if (transaction.metadata && typeof transaction.metadata === 'string') {
        try {
          transaction.metadata = JSON.parse(transaction.metadata);
        } catch (e) {
          logger.warn('Failed to parse transaction metadata', { transactionId });
        }
      }

      const auditLogId = generateTokenId();
      await safeQuery(
        `INSERT INTO audit_logs (
          audit_log_id,
          payment_transaction_id,
          event_id,
          event_type,
          previous_state,
          new_state,
          timestamp,
          source_service,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)`,
        [
          auditLogId,
          transactionId,
          eventId,
          'payment_initiated',
          null,
          current_state,
          'node-api',
          JSON.stringify({ ingested_by: authReq.user?.email || 'system', ...normalizedMetadata })
        ]
      );

      if (isRedisConnected()) {

        await safeRedisDel('transactions:all:50:0');
        await safeRedisDel(`transactions:${merchant_id}:50:0`);

      }

      logger.info('Transaction ingested successfully', { 
        transactionId, 
        merchant_id, 
        amount: amountInCents,
        currency,
        state: current_state,
        userId: authReq.user?.id 
      });

      res.status(201).json({ transaction });
    } catch (error: any) {
      logger.error('Failed to ingest transaction', {
        error: error.message,
        code: error.code
      });

      if (error.code === '23505') { // Unique violation
        const apiError: ApiError = new Error('Transaction ID already exists');
        apiError.statusCode = 409;
        apiError.code = 'TRANSACTION_EXISTS';
        return next(apiError);
      }

      next(error);
    }
  }
);

transactionsRouter.get(
  '/:transactionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId } = req.params;

      const result = await safeQuery(
        'SELECT * FROM payment_transactions WHERE payment_transaction_id = $1',
        [transactionId]
      );

      if (result.rows.length === 0) {
        const error: ApiError = new Error('Transaction not found');
        error.statusCode = 404;
        return next(error);
      }

      res.json({ transaction: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

