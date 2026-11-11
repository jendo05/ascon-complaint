import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import routes from './routes/index.route.js';
import { HttpError } from './middleware/index.middleware.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes('*') || env.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', routes);

app.use((_, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((error: unknown, _: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues.map((issue) => issue.message).join('; ') });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Request body contains invalid JSON.' });
    return;
  }
  if (env.nodeEnv !== 'production') console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

export default app;
