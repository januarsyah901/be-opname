import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import { 
  revenueReport, 
  topProductsReport, 
  topServicesReport, 
  lowStockReport, 
  opnameReport, 
  vehicleRatioReport, 
  remindersReport,
  dashboardStatsReport,
  recentActivitiesReport
} from '../controllers/reportController';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);
router.get('/revenue', revenueReport);
router.get('/top-products', topProductsReport);
router.get('/top-services', topServicesReport);
router.get('/low-stock', lowStockReport);
router.get('/opname/:id', opnameReport);
router.get('/vehicle-ratio', vehicleRatioReport);
router.get('/reminders', remindersReport);
router.get('/dashboard-stats', dashboardStatsReport);
router.get('/recent-activities', recentActivitiesReport);

export default router;
