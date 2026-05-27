import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';

const app = express();

// Request logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global middlewares
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/auth', authRoutes);

// Catch-all handlers
app.use(notFound);
app.use(errorHandler);

export default app;
