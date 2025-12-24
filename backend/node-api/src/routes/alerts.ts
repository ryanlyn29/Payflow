import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { safeQuery } from '../db/postgres';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const alertsRouter = Router();

alertsRouter.use(authenticate);

alertsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolved, severity, limit = 100 } = req.query;

    let queryText = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (resolved !== undefined) {
      queryText += ` AND resolved = $${paramCount++}`;
      params.push(resolved === 'true');
    }

    if (severity) {
      queryText += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }

    queryText += ` ORDER BY detected_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await safeQuery(queryText, params);
    res.json(result.rows);
  } catch (error: any) {
    const { resolved, severity } = req.query;
    logger.error('Failed to fetch alerts', {
      error: error.message,
      code: error.code,
      resolved: resolved !== undefined ? resolved : null,
      severity: severity || null
    });

    if (process.env.NODE_ENV === 'production') {
      const apiError: ApiError = new Error('Failed to fetch alerts');
      apiError.statusCode = 500;
      apiError.code = 'ALERTS_FETCH_FAILED';
      return next(apiError);
    }

    if (error.code === '42P01' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.warn('Database unavailable in development, returning empty array', error.message);
      return res.json([]);
    }
    
    next(error);
  }
});

alertsRouter.patch('/:alertId/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertId } = req.params;

    const result = await safeQuery(
      'UPDATE alerts SET resolved = true, resolved_at = NOW() WHERE alert_id = $1 RETURNING *',
      [alertId]
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('Alert not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ alert: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

