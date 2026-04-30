import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import {
    listWorkOrders,
    createWorkOrder,
    getWorkOrder,
    updateWorkOrder,
    updateWorkOrderStatus,
    assignMechanic,
    deleteWorkOrder,
    updateWorkOrderChecklist,
    getWorkOrderInspection,
    updateWorkOrderInspection
} from '../controllers/workOrderController';

const router = Router();

router.use(authenticate);

router.get('/', listWorkOrders);
router.post('/', createWorkOrder);
router.get('/:id', getWorkOrder);
router.put('/:id', updateWorkOrder);
router.patch('/:id/status', updateWorkOrderStatus);
router.patch('/:id/mechanic', assignMechanic);
router.get('/:id/inspection', authorizeAdmin, getWorkOrderInspection);
router.put('/:id/inspection', authorizeAdmin, updateWorkOrderInspection);
router.patch('/:id/checklist/:checklistId', updateWorkOrderChecklist);
router.delete('/:id', deleteWorkOrder);

export default router;
