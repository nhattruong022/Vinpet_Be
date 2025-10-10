import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();

// User routes
router.put('/profile', UserController.updateProfile);

export default router;
