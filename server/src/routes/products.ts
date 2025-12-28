import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('merchant'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('merchant'), updateProduct)
  .delete(protect, authorize('merchant'), deleteProduct);

export default router;


