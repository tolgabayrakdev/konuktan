import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import customerRoutes from './routes/customer.routes.js';
import processRoutes from './routes/process.routes.js';
import activityRoutes from './routes/activity.routes.js';
import './events/email.events.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import logger from './config/logger.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  morgan('dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/activities', activityRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota bulunamadı' });
});

app.use(errorHandler);

export default app;
