import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';

const router = Router();

// Contact routes
router.post('/', ContactController.sendContactEmail);

export default router;

