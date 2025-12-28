"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect); // All cart routes require authentication
router.route('/')
    .get(cartController_1.getCart)
    .delete(cartController_1.clearCart);
router.route('/items')
    .post(cartController_1.addToCart);
router.route('/items/:itemIndex')
    .put(cartController_1.updateCartItem)
    .delete(cartController_1.removeFromCart);
exports.default = router;
