import { Router } from 'express';
import {
  getMyAssignedOrders,
  getAssignedOrder,
  confirmOrder,
  markOrderReady,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/merchantOrderController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('merchant')); // All merchant routes require merchant role

router.route('/orders')
  .get(getMyAssignedOrders);

router.route('/orders/:id')
  .get(getAssignedOrder);

router.route('/orders/:id/confirm')
  .put(confirmOrder);

router.route('/orders/:id/ready')
  .put(markOrderReady);

router.route('/notifications')
  .get(getNotifications);

router.route('/notifications/read-all')
  .put(markAllNotificationsAsRead);

router.route('/notifications/:id/read')
  .put(markNotificationAsRead);

export default router;


