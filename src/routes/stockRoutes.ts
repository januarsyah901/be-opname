import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listMovements, stockIn, stockOut } from '../controllers/stockController';

const router = Router();

router.use(authenticate);
router.get('/', authorizeAdmin, listMovements);   // GET /stock-movements
router.post('/in', authorizeAdmin, stockIn);      // POST /stock/in
router.post('/out', authorizeAdmin, stockOut);    // POST /stock/out

export default router;
