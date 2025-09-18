import { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cookieParser from 'cookie-parser';

const configureMiddleware = (app: Application): void => {
  // Security middleware
  app.use(helmet());

  // CORS configuration - Allow all origins with credentials
  app.use(
    cors({
      origin: true, // Allow all origins
      credentials: true, // Allow credentials (cookies, auth headers)
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing middleware
  app.use(cookieParser());

  // Serve static files for uploads
  app.use('/uploads', express.static('uploads'));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Status: ${res.statusCode}`);
    next();
  });
};

export default configureMiddleware;
