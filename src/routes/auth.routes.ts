import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, logout, updateMe } from '../controllers/auth.controller';
import { authJwt } from '../middleware/authJwt';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.get('/me', authJwt, me);
router.patch("/me", authJwt, updateMe);
router.post('/logout', authJwt, logout);

export default router;
