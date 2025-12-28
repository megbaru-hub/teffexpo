"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = exports.confirmOrder = exports.getAssignedOrder = exports.getMyAssignedOrders = void 0;
const http_status_codes_1 = require("http-status-codes");
const Order_1 = __importDefault(require("../models/Order"));
const Notification_1 = __importDefault(require("../models/Notification"));
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Get merchant's assigned orders
// @route   GET /api/v1/merchant/orders
// @access  Private (Merchant)
const getMyAssignedOrders = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {
            'assignedToMerchants.merchant': req.user.id
        };
        if (status) {
            query.orderStatus = status;
        }
        const orders = await Order_1.default.find(query)
            .populate('items.product')
            .populate('merchantBreakdown.merchant', 'name email')
            .sort({ createdAt: -1 });
        // Filter to only show items for this merchant
        const filteredOrders = orders.map(order => {
            const merchantAssignment = order.assignedToMerchants.find((a) => a.merchant.toString() === req.user.id);
            const merchantBreakdown = order.merchantBreakdown.find((b) => b.merchant.toString() === req.user.id);
            return {
                ...order.toObject(),
                myItems: order.items.filter((item) => item.merchant.toString() === req.user.id),
                myAmount: (merchantBreakdown === null || merchantBreakdown === void 0 ? void 0 : merchantBreakdown.amount) || 0,
                myStatus: (merchantAssignment === null || merchantAssignment === void 0 ? void 0 : merchantAssignment.status) || 'pending',
                notificationMethod: merchantAssignment === null || merchantAssignment === void 0 ? void 0 : merchantAssignment.notificationMethod,
                phoneCalled: merchantAssignment === null || merchantAssignment === void 0 ? void 0 : merchantAssignment.phoneCalled,
                messageSent: merchantAssignment === null || merchantAssignment === void 0 ? void 0 : merchantAssignment.messageSent
            };
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            count: filteredOrders.length,
            data: filteredOrders
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyAssignedOrders = getMyAssignedOrders;
// @desc    Get single assigned order
// @route   GET /api/v1/merchant/orders/:id
// @access  Private (Merchant)
const getAssignedOrder = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('items.product')
            .populate('merchantBreakdown.merchant', 'name email');
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        const merchantAssignment = order.assignedToMerchants.find((a) => a.merchant.toString() === req.user.id);
        if (!merchantAssignment) {
            return next(new errorResponse_1.ErrorResponse('This order is not assigned to you', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        const merchantBreakdown = order.merchantBreakdown.find((b) => b.merchant.toString() === req.user.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
                ...order.toObject(),
                myItems: order.items.filter((item) => item.merchant.toString() === req.user.id),
                myAmount: (merchantBreakdown === null || merchantBreakdown === void 0 ? void 0 : merchantBreakdown.amount) || 0,
                myStatus: merchantAssignment.status,
                notificationMethod: merchantAssignment.notificationMethod,
                phoneCalled: merchantAssignment.phoneCalled,
                messageSent: merchantAssignment.messageSent
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssignedOrder = getAssignedOrder;
// @desc    Confirm order assignment (Merchant)
// @route   PUT /api/v1/merchant/orders/:id/confirm
// @access  Private (Merchant)
const confirmOrder = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return next(new errorResponse_1.ErrorResponse(`Order not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        const merchantAssignment = order.assignedToMerchants.find((a) => a.merchant.toString() === req.user.id);
        if (!merchantAssignment) {
            return next(new errorResponse_1.ErrorResponse('This order is not assigned to you', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        merchantAssignment.status = 'confirmed';
        await order.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.confirmOrder = confirmOrder;
// @desc    Get merchant notifications
// @route   GET /api/v1/merchant/notifications
// @access  Private (Merchant)
const getNotifications = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { user: req.user.id };
        if (status) {
            query.status = status;
        }
        const notifications = await Notification_1.default.find(query)
            .populate('order')
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
// @desc    Mark notification as read
// @route   PUT /api/v1/merchant/notifications/:id/read
// @access  Private (Merchant)
const markNotificationAsRead = async (req, res, next) => {
    try {
        const notification = await Notification_1.default.findById(req.params.id);
        if (!notification) {
            return next(new errorResponse_1.ErrorResponse(`Notification not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        if (notification.user.toString() !== req.user.id) {
            return next(new errorResponse_1.ErrorResponse('Not authorized to update this notification', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        notification.status = 'read';
        notification.readAt = new Date();
        await notification.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: notification
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// @desc    Mark all notifications as read
// @route   PUT /api/v1/merchant/notifications/read-all
// @access  Private (Merchant)
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        await Notification_1.default.updateMany({ user: req.user.id, status: 'unread' }, { status: 'read', readAt: new Date() });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'All notifications marked as read'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
