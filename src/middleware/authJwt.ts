import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AppUserClaims {
  sub: string;       // user id
  role: 'employee' | 'manager' | 'admin';
  clientId?: string;
}

export function authJwt(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const claims = jwt.verify(token, env.jwtSecret) as AppUserClaims;
    (req as any).user = claims;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export function roleGuard(...roles: AppUserClaims['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AppUserClaims | undefined;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
