import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { deleteVehicle, updateVehicle } from '../controllers/vehicleController';

const router = Router();

router.use(authenticate);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
