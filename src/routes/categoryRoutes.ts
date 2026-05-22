import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';

const router = Router();

router.use(authenticate);
router.get('/', listCategories);
router.post('/', authorizeAdmin, createCategory);
router.put('/:id', authorizeAdmin, updateCategory);
router.delete('/:id', authorizeAdmin, deleteCategory);

export default router;
