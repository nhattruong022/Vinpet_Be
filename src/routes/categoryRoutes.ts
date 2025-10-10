import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const router = Router();

// Public routes
router.get('/', CategoryController.getCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/stats', CategoryController.getCategoryStats);
router.get('/slug/:slug', CategoryController.getCategoryBySlug);
router.get('/:id', CategoryController.getCategoryById);

// Protected routes (require authentication)
// router.post('/', authMiddleware, CategoryController.createCategory);
// router.put('/:id', authMiddleware, CategoryController.updateCategory);
// router.delete('/:id', authMiddleware, CategoryController.deleteCategory);

// Temporary: Allow all operations for testing
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;

