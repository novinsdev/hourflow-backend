import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { User } from '../models/User';

const r = Router();

/**
 * POST /api/v1/auth/login
 * body: { email: string, code: string }
 * - For quick demos, you can skip seeding and just use DEMO_LOGIN_CODE.
 * - If a user has loginCodeHash, we verify against that first.
 */
r.post('/login', async (req, res) => {
  try {
    const { email, code } = (req.body || {}) as { email?: string; code?: string };

    if (!email || !code) {
      return res.status(400).json({ error: 'invalid_request', message: 'email and code are required' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'invalid_code', message: 'code must be 6 digits' });
    }

    const normEmail = email.trim().toLowerCase();

    // Find or create a user (demo-friendly behavior)
    let user = await User.findOne({ email: normEmail });
    if (!user) {
      user = await User.create({
        email: normEmail,
        name: normEmail.split('@')[0],
        role: 'employee',
      });
    }

    // Validate code
    let ok = false;

    if (user.loginCodeHash) {
      ok = await bcrypt.compare(code, user.loginCodeHash);
      // Optional TTL check for real OTP flows
      if (ok && user.loginCodeExpiresAt && user.loginCodeExpiresAt.getTime() < Date.now()) {
        return res.status(401).json({ error: 'code_expired' });
      }
    } else {
      // Fallback: global demo code (easiest path)
      ok = code === (env.demoLoginCode || '');
    }

    if (!ok) {
      return res.status(401).json({ error: 'invalid_code' });
    }

    const claims = {
      sub: String(user._id),
      role: user.role,
      clientId: user.clientId ? String(user.clientId) : undefined,
    };

    const token = jwt.sign(claims, env.jwtSecret, { algorithm: 'HS256', expiresIn: '2h' });
    return res.json({ token });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', message: e?.message });
  }
});

export default r;
