import './config/env'; // bắt buộc dòng đầu tiên
import { connectDB } from './config/database';
import { initializeWebSocket } from './socket';
import express, { Request, Response } from 'express';
import http from 'http';
import routes from './routes';
import configureMiddleware from './middlewares/config';
import { errorHandler } from './middlewares/errorHandler';
import { serve, setup } from 'swagger-ui-express';
import { specs, swaggerUiOptions } from './config/swagger';

const app = express();

configureMiddleware(app);

const server = http.createServer(app);

// Connect to database and setup collections
connectDB();

// Swagger API Documentation
app.use('/api-docs', serve, setup(specs, swaggerUiOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  return res.status(404).json({
    statusCode: 404,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
  });
});

// Use centralized error handler
app.use(errorHandler);

// Initialize WebSocket server
initializeWebSocket(server);

const port = process.env['PORT'] || 8080;
server.listen(port, () => {
  console.info(`Server running on http://localhost:${port}/`);
  console.info(`Swagger docs available at http://localhost:${port}/api-docs/`);
  console.info(`WebSocket server available on ws://localhost:${port}`);
});
