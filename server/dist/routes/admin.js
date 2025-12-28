"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect, (0, auth_1.authorize)('admin')); // All admin routes require admin role
router.route('/orders')
    .get(adminController_1.getAllOrders);
router.route('/orders/:id')
    .get(adminController_1.getOrderDetails);
router.route('/orders/:id/assign')
    .post(adminController_1.assignOrderToMerchants);
router.route('/orders/:id/complete')
    .put(adminController_1.completeOrder);
router.route('/orders/:id/breakdown')
    .get(adminController_1.getMerchantBreakdown);
router.route('/merchants')
    .get(adminController_1.getAllMerchants);
exports.default = router;
