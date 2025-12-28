"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const merchantOrderController_1 = require("../controllers/merchantOrderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect, (0, auth_1.authorize)('merchant')); // All merchant routes require merchant role
router.route('/orders')
    .get(merchantOrderController_1.getMyAssignedOrders);
router.route('/orders/:id')
    .get(merchantOrderController_1.getAssignedOrder);
router.route('/orders/:id/confirm')
    .put(merchantOrderController_1.confirmOrder);
router.route('/notifications')
    .get(merchantOrderController_1.getNotifications);
router.route('/notifications/read-all')
    .put(merchantOrderController_1.markAllNotificationsAsRead);
router.route('/notifications/:id/read')
    .put(merchantOrderController_1.markNotificationAsRead);
exports.default = router;
