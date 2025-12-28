"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMerchants = exports.getMerchantBreakdown = exports.completeOrder = exports.assignOrderToMerchants = exports.getOrderDetails = exports.getAllOrders = void 0;
const http_status_codes_1 = require("http-status-codes");
const Order_1 = __importDefault(require("../models/Order"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Get all orders (Admin only)
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
    try {
        const { status, paymentStatus } = req.query;
        const query = {};
        if (status) {
            query.orderStatus = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        const orders = await Order_1.default.find(query)
            .populate('items.merchant', 'name email phone')
            .populate('merchantBreakdown.merchant', 'name email phone')
            .populate('createdBy', 'name email')
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
exports.getAllOrders = getAllOrders;
// @desc    Get order details with merchant breakdown (Admin only)
// @route   GET /api/v1/admin/orders/:id
// @access  Private (Admin)
const getOrderDetails = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('items.merchant', 'name email phone')
            .populate('merchantBreakdown.merchant', 'name email phone')
            .populate('assignedToMerchants.merchant', 'name email phone')
            .populate('createdBy', 'name email');
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
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
exports.getOrderDetails = getOrderDetails;
// @desc    Assign order to merchants (Admin only)
// @route   POST /api/v1/admin/orders/:id/assign
// @access  Private (Admin)
const assignOrderToMerchants = async (req, res, next) => {
    var _a;
    try {
        const { merchantIds, notificationMethod } = req.body; // notificationMethod: 'phone' | 'dashboard' | 'both'
        if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
            return next(new errorResponse_1.ErrorResponse('Please provide merchant IDs array', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
            return next(new errorResponse_1.ErrorResponse('Cannot assign completed or cancelled order', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Validate merchants exist and are merchants
        const merchants = await User_1.default.find({
            _id: { $in: merchantIds },
            role: 'merchant'
        });
        if (merchants.length !== merchantIds.length) {
            return next(new errorResponse_1.ErrorResponse('Some merchants not found or invalid', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Create assignments for each merchant
        const assignments = [];
        for (const merchant of merchants) {
            // Check if merchant has items in this order
            const hasItems = order.merchantBreakdown.some((breakdown) => breakdown.merchant.toString() === merchant._id.toString());
            if (!hasItems) {
                continue; // Skip merchants that don't have items in this order
            }
            const assignment = {
                merchant: merchant._id,
                status: 'pending',
                notificationMethod: notificationMethod === 'both' ? 'dashboard' : (notificationMethod || 'dashboard'),
                phoneCalled: notificationMethod === 'phone' || notificationMethod === 'both',
                messageSent: notificationMethod === 'dashboard' || notificationMethod === 'both'
            };
            assignments.push(assignment);
            // Create notification for merchant (if dashboard message)
            if (notificationMethod === 'dashboard' || notificationMethod === 'both') {
                await Notification_1.default.create({
                    user: merchant._id,
                    type: 'order_assigned',
                    title: 'New Order Assigned',
                    message: `You have a new order #${order._id} assigned to you. Total amount: ${((_a = order.merchantBreakdown.find(b => b.merchant.toString() === merchant._id.toString())) === null || _a === void 0 ? void 0 : _a.amount) || 0} ETB`,
                    order: order._id,
                    status: 'unread'
                });
            }
        }
        order.assignedToMerchants = assignments;
        order.orderStatus = 'assigned';
        order.assignedBy = req.user.id;
        await order.save();
        await order.populate('items.merchant', 'name email phone');
        await order.populate('merchantBreakdown.merchant', 'name email phone');
        await order.populate('assignedToMerchants.merchant', 'name email phone');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: order,
            message: `Order assigned to ${assignments.length} merchant(s). ${notificationMethod === 'phone' || notificationMethod === 'both' ? 'Please call them to notify.' : ''}`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignOrderToMerchants = assignOrderToMerchants;
// @desc    Mark order as completed (Admin only)
// @route   PUT /api/v1/admin/orders/:id/complete
// @access  Private (Admin)
const completeOrder = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        // Decrease stock for all products in order
        for (const item of order.items) {
            const product = await Product_1.default.findById(item.product);
            if (product) {
                product.stockAvailable -= item.quantity;
                if (product.stockAvailable < 0) {
                    product.stockAvailable = 0;
                }
                await product.save();
            }
        }
        // Update order status
        order.orderStatus = 'completed';
        order.completedAt = new Date();
        // Update merchant assignments
        for (const assignment of order.assignedToMerchants) {
            assignment.status = 'completed';
        }
        await order.save();
        // Create notifications for merchants
        for (const assignment of order.assignedToMerchants) {
            await Notification_1.default.create({
                user: assignment.merchant,
                type: 'order_completed',
                title: 'Order Completed',
                message: `Order #${order._id} has been completed. Your payment will be processed.`,
                order: order._id,
                status: 'unread'
            });
        }
        await order.populate('items.merchant', 'name email phone');
        await order.populate('merchantBreakdown.merchant', 'name email phone');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeOrder = completeOrder;
// @desc    Get merchant payment breakdown (Admin only)
// @route   GET /api/v1/admin/orders/:id/breakdown
// @access  Private (Admin)
const getMerchantBreakdown = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('merchantBreakdown.merchant', 'name email phone');
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
                orderId: order._id,
                totalAmount: order.totalAmount,
                merchantBreakdown: order.merchantBreakdown
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMerchantBreakdown = getMerchantBreakdown;
// @desc    Get all merchants (Admin only)
// @route   GET /api/v1/admin/merchants
// @access  Private (Admin)
const getAllMerchants = async (req, res, next) => {
    try {
        const merchants = await User_1.default.find({ role: 'merchant' }).select('-password');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            count: merchants.length,
            data: merchants
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllMerchants = getAllMerchants;
