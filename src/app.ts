import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env';
import authRoutes from './routes/auth.routes';
// import meRoutes from './routes/me'; // if you keep it separate

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow non-browser tools
    const allow = new Set([...env.allowedOrigins, ...env.CORS_ORIGINS]);
    return allow.size === 0 || allow.has(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1', meRoutes); // optional, if using separate me.ts

// central error fallback (keep last)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

export default app;
