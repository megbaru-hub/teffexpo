import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Order from '../models/Order';
import Notification from '../models/Notification';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Get merchant's assigned orders
// @route   GET /api/v1/merchant/orders
// @access  Private (Merchant)
export const getMyAssignedOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    const query: any = {
      'assignedToMerchants.merchant': req.user.id
    };

    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .populate('merchantBreakdown.merchant', 'name email')
      .sort({ createdAt: -1 });

    // Filter to only show items for this merchant
    const filteredOrders = orders.map(order => {
      const merchantAssignment = order.assignedToMerchants.find(
        (a) => a.merchant.toString() === req.user.id
      );
      
      const merchantBreakdown = order.merchantBreakdown.find(
        (b) => b.merchant.toString() === req.user.id
      );

      return {
        ...order.toObject(),
        myItems: order.items.filter(
          (item) => item.merchant.toString() === req.user.id
        ),
        myAmount: merchantBreakdown?.amount || 0,
        myStatus: merchantAssignment?.status || 'pending',
        notificationMethod: merchantAssignment?.notificationMethod,
        phoneCalled: merchantAssignment?.phoneCalled,
        messageSent: merchantAssignment?.messageSent
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assigned order
// @route   GET /api/v1/merchant/orders/:id
// @access  Private (Merchant)
export const getAssignedOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('merchantBreakdown.merchant', 'name email');

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const merchantAssignment = order.assignedToMerchants.find(
      (a) => a.merchant.toString() === req.user.id
    );

    if (!merchantAssignment) {
      return next(new ErrorResponse('This order is not assigned to you', StatusCodes.FORBIDDEN));
    }

    const merchantBreakdown = order.merchantBreakdown.find(
      (b) => b.merchant.toString() === req.user.id
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...order.toObject(),
        myItems: order.items.filter(
          (item) => item.merchant.toString() === req.user.id
        ),
        myAmount: merchantBreakdown?.amount || 0,
        myStatus: merchantAssignment.status,
        notificationMethod: merchantAssignment.notificationMethod,
        phoneCalled: merchantAssignment.phoneCalled,
        messageSent: merchantAssignment.messageSent
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm order assignment (Merchant)
// @route   PUT /api/v1/merchant/orders/:id/confirm
// @access  Private (Merchant)
export const confirmOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const merchantAssignment = order.assignedToMerchants.find(
      (a) => a.merchant.toString() === req.user.id
    );

    if (!merchantAssignment) {
      return next(new ErrorResponse('This order is not assigned to you', StatusCodes.FORBIDDEN));
    }

    merchantAssignment.status = 'confirmed';
    await order.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get merchant notifications
// @route   GET /api/v1/merchant/notifications
// @access  Private (Merchant)
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const query: any = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const notifications = await Notification.find(query)
      .populate('order')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(StatusCodes.OK).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/merchant/notifications/:id/read
// @access  Private (Merchant)
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (notification.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this notification', StatusCodes.FORBIDDEN));
    }

    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/merchant/notifications/read-all
// @access  Private (Merchant)
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, status: 'unread' },
      { status: 'read', readAt: new Date() }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};


