"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrder = exports.getMyOrders = exports.createOrder = void 0;
const http_status_codes_1 = require("http-status-codes");
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Create order from cart
// @route   POST /api/v1/orders
// @access  Private
const createOrder = async (req, res, next) => {
    try {
        const { customer, paymentProof } = req.body;
        // Validate customer info
        if (!customer || !customer.name || !customer.phone || !customer.address || !customer.kebele) {
            return next(new errorResponse_1.ErrorResponse('Please provide customer name, phone, address, and kebele', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Get cart
        const cart = await Cart_1.default.findOne({ user: req.user.id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return next(new errorResponse_1.ErrorResponse('Cart is empty', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Validate all products and stock, and calculate totals
        const orderItems = [];
        const merchantMap = new Map();
        let totalAmount = 0;
        for (const cartItem of cart.items) {
            const product = await Product_1.default.findById(cartItem.product);
            if (!product) {
                return next(new errorResponse_1.ErrorResponse(`Product ${cartItem.product} not found`, http_status_codes_1.StatusCodes.NOT_FOUND));
            }
            if (product.stockAvailable < cartItem.quantity) {
                return next(new errorResponse_1.ErrorResponse(`Insufficient stock for ${product.teffType}. Available: ${product.stockAvailable} kg`, http_status_codes_1.StatusCodes.BAD_REQUEST));
            }
            const subtotal = cartItem.quantity * product.pricePerKilo;
            totalAmount += subtotal;
            orderItems.push({
                product: product._id,
                merchant: product.merchant,
                teffType: product.teffType,
                quantity: cartItem.quantity,
                pricePerKilo: product.pricePerKilo,
                subtotal: subtotal
            });
            // Group by merchant for breakdown
            const merchantId = product.merchant.toString();
            if (!merchantMap.has(merchantId)) {
                merchantMap.set(merchantId, {
                    merchant: product.merchant,
                    items: [],
                    amount: 0
                });
            }
            merchantMap.get(merchantId).items.push({
                product: product._id,
                merchant: product.merchant,
                teffType: product.teffType,
                quantity: cartItem.quantity,
                pricePerKilo: product.pricePerKilo,
                subtotal: subtotal
            });
            merchantMap.get(merchantId).amount += subtotal;
        }
        // Get merchant names for breakdown
        const merchantBreakdown = [];
        for (const [merchantId, data] of merchantMap.entries()) {
            const merchant = await User_1.default.findById(merchantId);
            merchantBreakdown.push({
                merchant: data.merchant,
                merchantName: (merchant === null || merchant === void 0 ? void 0 : merchant.name) || 'Unknown',
                amount: data.amount,
                items: data.items
            });
        }
        // Create order
        const order = await Order_1.default.create({
            customer: {
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                kebele: customer.kebele,
                googleMapsLink: customer.googleMapsLink
            },
            items: orderItems,
            totalAmount: totalAmount,
            paymentStatus: paymentProof ? 'paid' : 'pending',
            paymentProof: paymentProof,
            merchantBreakdown: merchantBreakdown,
            createdBy: req.user.id,
            orderStatus: 'pending'
        });
        // Clear cart
        cart.items = [];
        await cart.save();
        await order.populate('items.merchant', 'name email');
        await order.populate('merchantBreakdown.merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
// @desc    Get user orders
// @route   GET /api/v1/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order_1.default.find({ createdBy: req.user.id })
            .populate('items.merchant', 'name email')
            .populate('merchantBreakdown.merchant', 'name email')
            .sort({ createdAt: -1 });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            count: orders.length,
            data: orders
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyOrders = getMyOrders;
// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
    var _a;
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('items.merchant', 'name email')
            .populate('merchantBreakdown.merchant', 'name email')
            .populate('assignedToMerchants.merchant', 'name email phone');
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        // Check if user has access (created the order, is admin, or is assigned merchant)
        const isCreator = ((_a = order.createdBy) === null || _a === void 0 ? void 0 : _a.toString()) === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isAssignedMerchant = order.assignedToMerchants.some((assignment) => assignment.merchant.toString() === req.user.id);
        if (!isCreator && !isAdmin && !isAssignedMerchant) {
            return next(new errorResponse_1.ErrorResponse('Not authorized to access this order', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrder = getOrder;
