import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import postRoutes from './postRoutes';
import mediaRoutes from './mediaRoutes';



const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/media', mediaRoutes);

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
        auth: '/api/auth',
        users: '/api/users',
        posts: '/api/posts',
        media: '/api/media'
      },
    },
  });
});

export default router;
