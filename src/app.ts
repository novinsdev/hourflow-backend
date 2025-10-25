import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { requestId } from './middleware/requestID';
import authRouter from './routes/auth';
import meRouter from './routes/me';
import healthRouter from './routes/health';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(requestId);

const corsOptions = {
  origin: (origin: any, cb: any) => {
    if (!origin) return cb(null, true); // mobile/dev tools
    if (env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('dev'));

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', meRouter);
app.use('/', healthRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// error handler (basic)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[err][${_req.headers['x-request-id']}]`, err);
  const status = err.status || 500;
  res.status(status).json({ error: err.code || 'server_error', message: env.nodeEnv === 'development' ? err.message : undefined });
});

export default app;
