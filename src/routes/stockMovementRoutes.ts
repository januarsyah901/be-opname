import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { listMovements } from '../controllers/stockController';

const router = Router();

router.use(authenticate);
router.get('/', authorizeAdmin, listMovements);   // GET /stock-movements

export default router;
