import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';

const router = Router();

// Contact routes
router.post('/', ContactController.createContact);
router.get('/', ContactController.getContacts);

export default router;

