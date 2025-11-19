import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import { User } from '../models/user.model';

const JWT_SECRET: Secret = env.JWT_SECRET as Secret;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

function signToken(user: any) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, clientId: user.clientId?.toString?.() },
    JWT_SECRET,
    // HS256 is the default; specifying algorithm sometimes trips TS overloads
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'bad_request', message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password.' });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, clientId: user.clientId },
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'not_found' });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      siteIds: user.siteIds ?? [],
      hourlyRate: user.hourlyRate,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function logout(_req: Request, res: Response) {
  return res.status(204).end();
}


