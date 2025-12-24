import { Router, Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const queueRouter = Router();

queueRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {

    logger.info('Queue stats requested - returning zeros (not yet integrated with queue system)');
    
    const stats = {
      ApproximateNumberOfMessages: 0,
      ApproximateNumberOfMessagesInFlight: 0,
      ApproximateNumberOfMessagesInDeadLetterQueue: 0
    };
    
    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch queue stats', error);
    next(error);
  }
});

