import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listPurchaseOrders, createPurchaseOrder, deletePurchaseOrder } from '../controllers/purchaseOrderController';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/', listPurchaseOrders);
router.post('/', createPurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
