"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect); // All order routes require authentication
router.route('/')
    .get(orderController_1.getMyOrders)
    .post(orderController_1.createOrder);
router.route('/:id')
    .get(orderController_1.getOrder);
exports.default = router;
