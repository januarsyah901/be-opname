import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { listCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer, getCustomerHistory } from '../controllers/customerController';
import { listVehicles, createVehicle } from '../controllers/vehicleController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles('owner', 'admin', 'kasir'), listCustomers);
router.post('/', authorizeRoles('owner', 'admin', 'kasir'), createCustomer);
router.get('/:id', authorizeRoles('owner', 'admin', 'kasir'), getCustomer);
router.put('/:id', authorizeRoles('owner', 'admin', 'kasir'), updateCustomer);
router.delete('/:id', authorizeRoles('owner', 'admin'), deleteCustomer);
router.get('/:id/history', authorizeRoles('owner', 'admin', 'kasir'), getCustomerHistory);
router.get('/:customerId/vehicles', authorizeRoles('owner', 'admin', 'kasir'), listVehicles);
router.post('/:customerId/vehicles', authorizeRoles('owner', 'admin', 'kasir'), createVehicle);

export default router;
