import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { safeQuery } from '../db/postgres';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const rulesRouter = Router();

rulesRouter.use(authenticate);

rulesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await safeQuery(
      'SELECT id, name, description, enabled, version, rule_definition, created_at, updated_at FROM rules ORDER BY created_at DESC',
      []
    );
    res.json(result.rows);
  } catch (error: any) {
    logger.error('Failed to fetch rules', { error: error.message, code: error.code });
    
    if (process.env.NODE_ENV === 'production') {
      const apiError: ApiError = new Error('Failed to fetch rules');
      apiError.statusCode = 500;
      apiError.code = 'RULES_FETCH_FAILED';
      return next(apiError);
    }
    
    if (error.code === '42P01' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.warn('Database unavailable in development, returning empty array', error.message);
      return res.json([]);
    }
    
    next(error);
  }
});

rulesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await safeQuery(
      'SELECT * FROM rules WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('Rule not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

rulesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, threshold, enabled = true, rule_definition } = req.body;

    if (!name || !description) {
      const error: ApiError = new Error('Name and description are required');
      error.statusCode = 400;
      return next(error);
    }

    const id = `RULE-${uuidv4()}`;
    const version = '1.0.0';
    const ruleDef = rule_definition || {
      operator: '<',
      threshold: threshold || '',
      description
    };

    const result = await safeQuery(
      `INSERT INTO rules (id, name, description, enabled, version, rule_definition, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, name, description, enabled, version, JSON.stringify(ruleDef)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

rulesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, threshold, enabled, rule_definition } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      params.push(enabled);
    }
    if (rule_definition !== undefined) {
      updates.push(`rule_definition = $${paramCount++}`);
      params.push(JSON.stringify(rule_definition));
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await safeQuery(
      `UPDATE rules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('Rule not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

rulesRouter.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const result = await safeQuery(
      'UPDATE rules SET enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [enabled, id]
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('Rule not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

rulesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await safeQuery(
      'DELETE FROM rules WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      const error: ApiError = new Error('Rule not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

