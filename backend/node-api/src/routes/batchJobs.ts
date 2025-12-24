import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

export const batchJobsRouter = Router();

batchJobsRouter.use(authenticate);

interface BatchJob {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  progress?: number;
  error_message?: string;
}

batchJobsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {

    logger.info('Batch jobs requested - returning empty array (not yet integrated with job scheduler)');
    res.json({ jobs: [] });
  } catch (error: any) {
    logger.error('Failed to fetch batch jobs', error);
    next(error);
  }
});

batchJobsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const error: ApiError = new Error('Batch job not found');
    error.statusCode = 404;
    error.code = 'JOB_NOT_FOUND';
    return next(error);
  } catch (error: any) {
    logger.error('Failed to fetch batch job', error);
    next(error);
  }
});

