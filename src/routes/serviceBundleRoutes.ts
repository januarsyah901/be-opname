import { Router } from 'express';
import { 
    listServiceBundles, 
    createServiceBundle, 
    getServiceBundle, 
    updateServiceBundle, 
    deleteServiceBundle 
} from '../controllers/serviceBundleController';
import { authenticate, authorizeAdmin, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Semua route di sini diproteksi oleh token
router.use(authenticate);

router.get('/', authorizeRoles('owner', 'admin', 'kasir'), listServiceBundles);
router.post('/', authorizeAdmin, createServiceBundle);
router.get('/:id', authorizeRoles('owner', 'admin', 'kasir'), getServiceBundle);
router.put('/:id', authorizeAdmin, updateServiceBundle);
router.delete('/:id', authorizeAdmin, deleteServiceBundle);

export default router;
