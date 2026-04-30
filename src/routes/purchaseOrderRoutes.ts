import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { listPurchaseOrders, createPurchaseOrder, deletePurchaseOrder } from '../controllers/purchaseOrderController';

const router = Router();

router.use(authenticate);

router.get('/', listPurchaseOrders);
router.post('/', createPurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
