import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listSpareParts, createSparePart, getSparePart, updateSparePart, deleteSparePart, getBarcode, printBarcode } from '../controllers/sparepartController';

const router = Router();

router.use(authenticate);
router.get('/', listSpareParts);
router.post('/', authorizeAdmin, createSparePart);
router.get('/:id', getSparePart);
router.put('/:id', authorizeAdmin, updateSparePart);
router.delete('/:id', authorizeAdmin, deleteSparePart);
router.get('/:id/barcode', getBarcode);
router.post('/:id/barcode/print', authorizeAdmin, printBarcode);

export default router;
