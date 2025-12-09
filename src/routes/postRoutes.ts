import { Router } from 'express';
import { PostController } from '../controllers/PostController';

const router = Router();

// Post routes
router.get('/', PostController.getPosts);
router.post('/seo-preview', PostController.getSeoPreview);
router.get('/:id', PostController.getPostById);
router.post('/', PostController.createPost);
router.put('/:id', PostController.updatePost);
router.delete('/:id', PostController.deletePost);
router.delete('/:id/images', PostController.deletePostImages);
router.post('/:id/duplicate', PostController.duplicatePost);

export default router;
