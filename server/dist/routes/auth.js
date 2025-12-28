"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const merchantController_1 = require("../controllers/merchantController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/me', auth_1.protect, authController_1.getMe);
router.get('/logout', auth_1.protect, authController_1.logout);
// Merchant routes
router.post('/merchant/register', merchantController_1.registerMerchant);
router.post('/merchant/login', merchantController_1.loginMerchant);
router.get('/merchant/me', auth_1.protect, merchantController_1.getMerchantProfile);
router.get('/merchant/products', auth_1.protect, merchantController_1.getMerchantProducts);
exports.default = router;
