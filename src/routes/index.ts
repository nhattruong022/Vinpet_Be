import { Router } from 'express';
import userRoutes from './userRoutes';



const router = Router();

// API Routes
router.use('/api/users', userRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    returnCode: 200,
    message: 'Welcome to Vinpet Backend API',
    result: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      clientIP: req.ip,
      endpoints: {
        users: '/api/users'
      },
    },
  });
});

export default router;
