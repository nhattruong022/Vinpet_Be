import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';

const router = Router();

// Media routes
router.post('/upload', MediaController.uploadMiddleware, MediaController.uploadFile);
router.delete('/:id', MediaController.deleteMedia);

export default router;
