import { Router } from 'express';
import {
  getAllOrders,
  getOrderDetails,
  assignOrderToMerchants,
  completeOrder,
  getMerchantBreakdown,
  getAllMerchants
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin')); // All admin routes require admin role

router.route('/orders')
  .get(getAllOrders);

router.route('/orders/:id')
  .get(getOrderDetails);

router.route('/orders/:id/assign')
  .post(assignOrderToMerchants);

router.route('/orders/:id/complete')
  .put(completeOrder);

router.route('/orders/:id/breakdown')
  .get(getMerchantBreakdown);

router.route('/merchants')
  .get(getAllMerchants);

export default router;


