import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { registerMerchant, loginMerchant, getMerchantProfile, getMerchantProducts } from '../controllers/merchantController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

// Merchant routes
router.post('/merchant/register', registerMerchant);
router.post('/merchant/login', loginMerchant);
router.get('/merchant/me', protect, getMerchantProfile);
router.get('/merchant/products', protect, getMerchantProducts);

export default router;
