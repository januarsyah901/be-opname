import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listOpnames, createOpname, getOpname, addOpnameItem, updateOpnameItem, closeOpname } from '../controllers/opnameController';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);
router.get('/', listOpnames);
router.post('/', createOpname);
router.get('/:id', getOpname);
router.post('/:id/items', addOpnameItem);
router.put('/:id/items/:item_id', updateOpnameItem);
router.post('/:id/close', closeOpname);

export default router;
