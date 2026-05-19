import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder
} from '../controllers/orderController';
import { protect } from '../middleware/auth';

const router = Router();

// Create order - no auth required (guest checkout)
router.route('/')
  .post(createOrder);

// Get my orders - requires authentication
router.route('/')
  .get(protect, getMyOrders);

// Get single order - requires authentication
router.route('/:id')
  .get(protect, getOrder);

export default router;

