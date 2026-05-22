import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { getSettings, updateSettings } from '../controllers/settingController';

const router = Router();

router.use(authenticate);
router.get('/', getSettings);
router.put('/', authorizeAdmin, updateSettings);

export default router;
