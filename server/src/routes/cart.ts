import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // All cart routes require authentication

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.route('/items')
  .post(addToCart);

router.route('/items/:itemIndex')
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;


