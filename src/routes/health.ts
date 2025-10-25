import { Router } from 'express';
const r = Router();

r.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), version: '1.0.0' });
});

export default r;
