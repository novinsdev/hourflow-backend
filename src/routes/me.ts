import { Router } from 'express';
import { authJwt } from '../middleware/authJwt';
import { User } from '../models/user.model';

const router = Router();

router.get('/me', authJwt, async (req, res) => {
  const id = (req as any).user?.id || (req as any).user?.sub;
  if (!id) return res.status(401).json({ error: 'unauthorized' });
  const user = await User.findById(id);
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
});

export default router;
