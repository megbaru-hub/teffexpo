"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.route('/')
    .get(productController_1.getProducts)
    .post(auth_1.protect, (0, auth_1.authorize)('merchant'), productController_1.createProduct);
router.route('/:id')
    .get(productController_1.getProduct)
    .put(auth_1.protect, (0, auth_1.authorize)('merchant'), productController_1.updateProduct)
    .delete(auth_1.protect, (0, auth_1.authorize)('merchant'), productController_1.deleteProduct);
exports.default = router;
