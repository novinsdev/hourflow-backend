// routes/benefit.routes.ts
import { Router } from 'express';
import { getAllBenefits } from '../controllers/benefit.controller';

const router = Router();

// Public read-only endpoint for the mobile app
router.get('/', getAllBenefits);

export default router;
