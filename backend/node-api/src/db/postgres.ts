import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

const poolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'paysignal',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
  min: parseInt(process.env.POSTGRES_MIN_CONNECTIONS || '2'),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '5000'),
  statement_timeout: parseInt(process.env.POSTGRES_STATEMENT_TIMEOUT || '30000'), // 30 seconds
  query_timeout: parseInt(process.env.POSTGRES_QUERY_TIMEOUT || '30000'),

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const db = new Pool(poolConfig);

let isConnected = false;
let lastConnectionError: Error | null = null;

db.on('error', (err: Error) => {
  logger.error('Unexpected error on idle PostgreSQL client', {
    error: err.message,
    code: (err as any).code,
    stack: err.stack
  });
  isConnected = false;
  lastConnectionError = err;
});

const testConnection = async () => {
  try {
    const result = await Promise.race([
      db.query('SELECT NOW(), version()'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), poolConfig.connectionTimeoutMillis)
      )
    ]);
    isConnected = true;
    lastConnectionError = null;
    logger.info('PostgreSQL connection established', {
      version: result.rows[0]?.version?.split(' ')[0] || 'unknown',
      database: poolConfig.database
    });
  } catch (err: any) {
    isConnected = false;
    lastConnectionError = err;
    const errorMessage = err.code === 'ECONNREFUSED'
      ? 'Connection refused - PostgreSQL may not be running'
      : err.code === 'ENOTFOUND'
      ? `Host not found: ${poolConfig.host}`
      : err.code === '28P01'
      ? 'Authentication failed - check username/password'
      : err.code === '3D000'
      ? `Database "${poolConfig.database}" does not exist`
      : err.message || 'Connection failed';
    
    logger.error('PostgreSQL connection failed', {
      error: errorMessage,
      code: err.code,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database
    });
  }
};

testConnection();

export const isPostgresConnected = (): boolean => {
  return isConnected && db.totalCount > 0;
};

export const getPostgresStatus = () => {
  return {
    connected: isConnected,
    totalConnections: db.totalCount,
    idleConnections: db.idleCount,
    waitingCount: db.waitingCount,
    lastError: lastConnectionError?.message || null
  };
};

export const safeQuery = async <T extends Record<string, any> = any>(
  text: string,
  params?: any[],
  timeout?: number
): Promise<QueryResult<T>> => {
  const queryTimeout = timeout || poolConfig.query_timeout;
  
  try {
    const result = await Promise.race([
      db.query<T>(text, params),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${queryTimeout}ms`)), queryTimeout)
      )
    ]);
    return result;
  } catch (error: any) {

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isConnected = false;
      lastConnectionError = error;
      const dbError = new Error(`Database connection failed: ${error.message}`);
      (dbError as any).code = error.code;
      throw dbError;
    }
    throw error;
  }
};

export const closePostgres = async (): Promise<void> => {
  try {
    await db.end();
    isConnected = false;
    logger.info('PostgreSQL connection pool closed');
  } catch (error: any) {
    logger.error('Error closing PostgreSQL connection pool', error);
    throw error;
  }
};

