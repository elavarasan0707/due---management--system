import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { User } from '../src/types';

// In-memory token storage (token -> userId)
const tokenStore = new Map<string, { userId: string; createdAt: number }>();

export function createToken(user: User): string {
  const token = `cnd_${crypto.randomBytes(24).toString('hex')}`;
  tokenStore.set(token, { userId: user.id, createdAt: Date.now() });
  return token;
}

export function revokeToken(token: string) {
  tokenStore.delete(token);
}

export function getUserByToken(token: string): User | null {
  const session = tokenStore.get(token);
  if (!session) return null;
  return db.findUserById(session.userId);
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  const session = tokenStore.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  const user = db.findUserById(session.userId);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ error: 'Unauthorized: User inactive or not found' });
  }

  req.user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${roles.join(', ')}]. You are [${req.user.role}].`
      });
    }
    next();
  };
}
