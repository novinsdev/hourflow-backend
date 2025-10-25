import { Router } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { env } from '../config/env';
import { User } from '../models/User';

let initialized = false;
function initFirebase() {
  if (initialized) return;
  if (env.firebaseServiceAccountJson) {
    const svc = JSON.parse(env.firebaseServiceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  initialized = true;
}

const r = Router();

r.post('/verify', async (req, res) => {
  try {
    initFirebase();
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) return res.status(400).json({ error: 'missing_id_token' });

    const decoded = await admin.auth().verifyIdToken(idToken);

    // upsert user
    let user = await User.findOne({ email: decoded.email });
    if (!user) {
      user = await User.create({
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        photoUrl: decoded.picture,
        role: 'employee',
      });
    }

    const token = jwt.sign(
      { sub: String(user._id), role: user.role, clientId: user.clientId ? String(user.clientId) : undefined },
      env.jwtSecret,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (e: any) {
    res.status(401).json({ error: 'invalid_token', message: e?.message });
  }
});

export default r;
