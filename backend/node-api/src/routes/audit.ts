import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db/postgres';

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get('/transactions/:transactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    const result = await db.query(
      `SELECT * FROM audit_logs 
       WHERE payment_transaction_id = $1 
       ORDER BY timestamp DESC`,
      [transactionId]
    );

    res.json({ logs: result.rows });
  } catch (error) {
    next(error);
  }
});

