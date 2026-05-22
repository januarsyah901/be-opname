import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { deleteVehicle, updateVehicle } from '../controllers/vehicleController';

const router = Router();

router.use(authenticate);
router.put('/:id', authorizeRoles('owner', 'admin', 'kasir'), updateVehicle);
router.delete('/:id', authorizeRoles('owner', 'admin'), deleteVehicle);

export default router;
