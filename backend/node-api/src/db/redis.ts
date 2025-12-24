import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let isConnected = false;
let lastConnectionError: Error | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
    reconnectStrategy: (retries: number): number | Error => {
      reconnectAttempts = retries;
      if (retries > MAX_RECONNECT_ATTEMPTS) {
        logger.warn('Redis reconnection failed after max attempts - continuing without Redis');
        isConnected = false;
        return new Error('Max reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.info(`Redis reconnecting (attempt ${retries}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
      return delay;
    },
    keepAlive: 10000,
    keepAliveInitialDelay: 10000
  },

  pingInterval: parseInt(process.env.REDIS_PING_INTERVAL || '30000'), // 30 seconds
};

export const redisClient: RedisClientType = createClient(redisConfig) as RedisClientType;

redisClient.on('error', (err: Error) => {
  logger.error('Redis Client Error', {
    error: err.message,
    code: (err as any).code,
    stack: err.stack
  });
  isConnected = false;
  lastConnectionError = err;
});

redisClient.on('connect', () => {
  logger.info('Redis client connecting...');
  isConnected = false; // Not ready yet
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
  isConnected = true;
  lastConnectionError = null;
  reconnectAttempts = 0;
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
  isConnected = false;
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
  isConnected = false;
});

redisClient.connect().catch((err: Error) => {
  const errorMessage = err.message.includes('ECONNREFUSED')
    ? 'Connection refused - Redis may not be running'
    : err.message.includes('ENOTFOUND')
    ? 'Host not found'
    : err.message;
  
  logger.warn('Redis connection failed - continuing without Redis', {
    error: errorMessage,
    url: redisConfig.url
  });
  isConnected = false;
  lastConnectionError = err;
});

export const isRedisConnected = (): boolean => {
  return isConnected && redisClient.isOpen;
};

export const safeRedisPing = async (timeout: number = 2000): Promise<boolean> => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    
    const pingPromise = redisClient.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), timeout)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch (error: any) {
    isConnected = false;
    if (error.message !== 'Redis ping timeout') {
      lastConnectionError = error;
    }
    return false;
  }
};

export const safeRedisGet = async (key: string): Promise<string | null> => {
  try {
    if (!isRedisConnected()) {
      return null;
    }
    return await redisClient.get(key);
  } catch (error: any) {
    logger.warn('Redis GET operation failed', { key, error: error.message });
    isConnected = false;
    return null;
  }
};

export const safeRedisSet = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
    return true;
  } catch (error: any) {
    logger.warn('Redis SET operation failed', { key, error: error.message });
    isConnected = false;
    return false;
  }
};

export const safeRedisDel = async (key: string): Promise<boolean> => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (error: any) {
    logger.warn('Redis DEL operation failed', { key, error: error.message });
    isConnected = false;
    return false;
  }
};

export const getRedisStatus = () => {
  return {
    connected: isConnected,
    isOpen: redisClient.isOpen,
    reconnectAttempts,
    lastError: lastConnectionError?.message || null
  };
};

export const closeRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      isConnected = false;
      logger.info('Redis connection closed');
    }
  } catch (error: any) {
    logger.error('Error closing Redis connection', error);
    throw error;
  }
};

