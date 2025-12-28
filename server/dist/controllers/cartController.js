"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const http_status_codes_1 = require("http-status-codes");
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = async (req, res, next) => {
    try {
        let cart = await Cart_1.default.findOne({ user: req.user.id })
            .populate('items.product', 'teffType pricePerKilo stockAvailable merchant')
            .populate('items.merchant', 'name email');
        if (!cart) {
            cart = await Cart_1.default.create({ user: req.user.id, items: [] });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: cart
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCart = getCart;
// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || !quantity) {
            return next(new errorResponse_1.ErrorResponse('Please provide productId and quantity', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Get product and verify it exists and has stock
        const product = await Product_1.default.findById(productId);
        if (!product) {
            return next(new errorResponse_1.ErrorResponse('Product not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (product.stockAvailable < quantity) {
            return next(new errorResponse_1.ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Get or create cart
        let cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart_1.default.create({ user: req.user.id, items: [] });
        }
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (product.stockAvailable < newQuantity) {
                return next(new errorResponse_1.ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, http_status_codes_1.StatusCodes.BAD_REQUEST));
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        }
        else {
            // Add new item
            cart.items.push({
                product: product._id,
                merchant: product.merchant,
                teffType: product.teffType,
                quantity: quantity,
                pricePerKilo: product.pricePerKilo
            });
        }
        await cart.save();
        await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
        await cart.populate('items.merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: cart
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addToCart = addToCart;
// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemIndex
// @access  Private
const updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const itemIndex = parseInt(req.params.itemIndex);
        if (!quantity || quantity < 0.1) {
            return next(new errorResponse_1.ErrorResponse('Please provide a valid quantity (minimum 0.1 kg)', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            return next(new errorResponse_1.ErrorResponse('Cart not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (itemIndex < 0 || itemIndex >= cart.items.length) {
            return next(new errorResponse_1.ErrorResponse('Invalid item index', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Verify stock availability
        const product = await Product_1.default.findById(cart.items[itemIndex].product);
        if (!product) {
            return next(new errorResponse_1.ErrorResponse('Product not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (product.stockAvailable < quantity) {
            return next(new errorResponse_1.ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
        await cart.populate('items.merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: cart
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCartItem = updateCartItem;
// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemIndex
// @access  Private
const removeFromCart = async (req, res, next) => {
    try {
        const itemIndex = parseInt(req.params.itemIndex);
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            return next(new errorResponse_1.ErrorResponse('Cart not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (itemIndex < 0 || itemIndex >= cart.items.length) {
            return next(new errorResponse_1.ErrorResponse('Invalid item index', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        cart.items.splice(itemIndex, 1);
        await cart.save();
        await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
        await cart.populate('items.merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: cart
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromCart = removeFromCart;
// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            return next(new errorResponse_1.ErrorResponse('Cart not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        cart.items = [];
        await cart.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: cart
        });
    }
    catch (error) {
        next(error);
    }
};
exports.clearCart = clearCart;
