import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    payload, 
    JWT_SECRET, 
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'paysignal-api',
      audience: 'paysignal-client'
    } as SignOptions
  );
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    payload, 
    JWT_REFRESH_SECRET, 
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'paysignal-api',
      audience: 'paysignal-client'
    } as SignOptions
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'paysignal-api',
    audience: 'paysignal-client'
  }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'paysignal-api',
    audience: 'paysignal-client'
  }) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateUserId(): string {
  return `USR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateTokenId(): string {
  return `TOK-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

