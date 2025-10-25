import { Router } from 'express';
import { authJwt } from '../middleware/authJwt';
import { User } from '../models/User';

const r = Router();

r.get('/me', authJwt, async (req, res) => {
  const userId = req.user!.sub;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
  });
});

export default r;
