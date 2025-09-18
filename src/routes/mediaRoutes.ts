import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';

const router = Router();

// Media routes
router.post('/upload', MediaController.uploadMiddleware, MediaController.uploadFile);
router.get('/:filename', MediaController.getMediaInfo);
router.delete('/:filename', MediaController.deleteMedia);

export default router;
