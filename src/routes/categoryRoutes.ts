import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const router = Router();

// Public routes
router.get('/tree', CategoryController.getCategoryTree);
router.get('/:id/posts', CategoryController.getCategoryPosts); // Get posts by category (for menu click)


// Temporary: Allow all operations for testing
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;

