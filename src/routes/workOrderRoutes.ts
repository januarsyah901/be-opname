import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizeRoles } from '../middlewares/authMiddleware';
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
router.post('/', authorizeRoles('owner', 'admin', 'kasir'), createWorkOrder);
router.get('/:id', getWorkOrder);
router.put('/:id', authorizeRoles('owner', 'admin', 'kasir'), updateWorkOrder);
router.patch('/:id/status', authorizeRoles('owner', 'admin', 'kasir', 'mekanik'), updateWorkOrderStatus);
router.patch('/:id/mechanic', authorizeAdmin, assignMechanic);
router.get('/:id/inspection', authorizeRoles('owner', 'admin', 'mekanik'), getWorkOrderInspection);
router.put('/:id/inspection', authorizeRoles('owner', 'admin', 'mekanik'), updateWorkOrderInspection);
router.patch('/:id/checklist/:checklistId', authorizeRoles('owner', 'admin', 'mekanik'), updateWorkOrderChecklist);
router.delete('/:id', authorizeRoles('owner', 'admin', 'kasir'), deleteWorkOrder);

export default router;
