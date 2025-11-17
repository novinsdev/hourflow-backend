import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';

const JWT_SECRET = env.JWT_SECRET;

export interface AuthUser {
  id: string;
  role: 'employee' | 'manager' | 'admin';
  clientId?: string;
}

export function authJwt(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = { id: decoded.sub, role: decoded.role, email: decoded.email, clientId: decoded.clientId } as AuthUser;
    return next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export function roleGuard(...allowed: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as AuthUser['role'] | undefined;
    if (!role) return res.status(401).json({ error: 'unauthorized' });
    if (!allowed.includes(role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}
