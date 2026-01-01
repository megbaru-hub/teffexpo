import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Order from '../models/Order';
import Notification from '../models/Notification';
import User from '../models/User';
import Product from '../models/Product';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Get all orders (Admin only)
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, paymentStatus } = req.query;
    const query: any = {};

    if (status) {
      query.orderStatus = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(query)
      .populate('items.merchant', 'name email phone')
      .populate('merchantBreakdown.merchant', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details with merchant breakdown (Admin only)
// @route   GET /api/v1/admin/orders/:id
// @access  Private (Admin)
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.merchant', 'name email phone')
      .populate('merchantBreakdown.merchant', 'name email phone')
      .populate('assignedToMerchants.merchant', 'name email phone')
      .populate('createdBy', 'name email');

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign order to merchants (Admin only)
// @route   POST /api/v1/admin/orders/:id/assign
// @access  Private (Admin)
export const assignOrderToMerchants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantIds, notificationMethod } = req.body; // notificationMethod: 'phone' | 'dashboard' | 'both'

    if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
      return next(new ErrorResponse('Please provide merchant IDs array', StatusCodes.BAD_REQUEST));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
      return next(new ErrorResponse('Cannot assign completed or cancelled order', StatusCodes.BAD_REQUEST));
    }

    // Validate merchants exist and are merchants
    const merchants = await User.find({
      _id: { $in: merchantIds },
      role: 'merchant'
    });

    if (merchants.length !== merchantIds.length) {
      return next(new ErrorResponse('Some merchants not found or invalid', StatusCodes.BAD_REQUEST));
    }

    // Create assignments for each merchant
    const assignments = [];
    for (const merchant of merchants) {
      // Check if merchant has items in this order
      const hasItems = order.merchantBreakdown.some(
        (breakdown) => breakdown.merchant.toString() === merchant._id.toString()
      );

      if (!hasItems) {
        continue; // Skip merchants that don't have items in this order
      }

      const assignment = {
        merchant: merchant._id,
        status: 'pending' as const,
        notificationMethod: notificationMethod === 'both' ? 'dashboard' : (notificationMethod || 'dashboard'),
        phoneCalled: notificationMethod === 'phone' || notificationMethod === 'both',
        messageSent: notificationMethod === 'dashboard' || notificationMethod === 'both'
      };

      assignments.push(assignment);

      // Create notification for merchant (if dashboard message)
      if (notificationMethod === 'dashboard' || notificationMethod === 'both') {
        await Notification.create({
          user: merchant._id,
          type: 'order_assigned',
          title: 'New Order Assigned',
          message: `You have a new order #${order._id} assigned to you. Total amount: ${order.merchantBreakdown.find(b => b.merchant.toString() === merchant._id.toString())?.amount || 0} ETB`,
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: order,
      message: `Order assigned to ${assignments.length} merchant(s). ${notificationMethod === 'phone' || notificationMethod === 'both' ? 'Please call them to notify.' : ''}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as completed (Admin only)
// @route   PUT /api/v1/admin/orders/:id/complete
// @access  Private (Admin)
export const completeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    // Decrease stock for all products in order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
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
      await Notification.create({
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get merchant payment breakdown (Admin only)
// @route   GET /api/v1/admin/orders/:id/breakdown
// @access  Private (Admin)
export const getMerchantBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('merchantBreakdown.merchant', 'name email phone');

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        orderId: order._id,
        totalAmount: order.totalAmount,
        merchantBreakdown: order.merchantBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all merchants (Admin only)
// @route   GET /api/v1/admin/merchants
// @access  Private (Admin)
export const getAllMerchants = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const merchants = await User.find({ role: 'merchant' }).select('-password');

    res.status(StatusCodes.OK).json({
      success: true,
      count: merchants.length,
      data: merchants
    });
  } catch (error) {
    next(error);
  }
};


