import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';
import { ErrorResponse } from '../utils/errorResponse';

export const getMyAssignedOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const where: any = {
      assignedToMerchants: {
        some: { merchantId: req.user.id },
      },
    };

    if (status) {
      where.orderStatus = (status as string).toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        assignedToMerchants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const filteredOrders = orders.map(order => {
      const merchantAssignment = order.assignedToMerchants.find(
        (a) => a.merchantId === req.user.id
      );
      const merchantBreakdown = order.merchantBreakdown.find(
        (b) => b.merchantId === req.user.id
      );

      const { assignedToMerchants, ...orderData } = order;

      return {
        ...orderData,
        myItems: order.items.filter(
          (item) => item.merchantId === req.user.id
        ),
        myAmount: merchantBreakdown?.amount || 0,
        myStatus: merchantAssignment?.status || 'PENDING',
        notificationMethod: merchantAssignment?.notificationMethod,
        phoneCalled: merchantAssignment?.phoneCalled,
        messageSent: merchantAssignment?.messageSent,
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignedOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        assignedToMerchants: true,
      },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const merchantAssignment = order.assignedToMerchants.find(
      (a) => a.merchantId === req.user.id
    );

    if (!merchantAssignment) {
      return next(new ErrorResponse('This order is not assigned to you', StatusCodes.FORBIDDEN));
    }

    const merchantBreakdown = order.merchantBreakdown.find(
      (b) => b.merchantId === req.user.id
    );

    const { assignedToMerchants, ...orderData } = order;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...orderData,
        myItems: order.items.filter(
          (item) => item.merchantId === req.user.id
        ),
        myAmount: merchantBreakdown?.amount || 0,
        myStatus: merchantAssignment.status,
        notificationMethod: merchantAssignment.notificationMethod,
        phoneCalled: merchantAssignment.phoneCalled,
        messageSent: merchantAssignment.messageSent,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        assignedToMerchants: true,
        items: true,
      },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const merchantAssignment = order.assignedToMerchants.find(
      (a) => a.merchantId === req.user.id
    );

    if (!merchantAssignment) {
      return next(new ErrorResponse('This order is not assigned to you', StatusCodes.FORBIDDEN));
    }

    const myItems = order.items.filter(
      (item) => item.merchantId === req.user.id && !item.stockDecreased
    );

    for (const item of myItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockAvailable: { decrement: item.quantity } },
      });
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { stockDecreased: true },
      });
    }

    await prisma.orderAssignment.update({
      where: { id: merchantAssignment.id },
      data: { status: 'CONFIRMED' },
    });

    const allConfirmed = order.assignedToMerchants.every(
      (a) => a.id === merchantAssignment.id || a.status === 'CONFIRMED'
    );

    if (allConfirmed) {
      await prisma.order.update({
        where: { id: req.params.id },
        data: { orderStatus: 'CONFIRMED' },
      });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        assignedToMerchants: true,
        merchantBreakdown: true,
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const markOrderReady = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { assignedToMerchants: true },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const merchantAssignment = order.assignedToMerchants.find(
      (a) => a.merchantId === req.user.id
    );

    if (!merchantAssignment) {
      return next(new ErrorResponse('This order is not assigned to you', StatusCodes.FORBIDDEN));
    }

    if (merchantAssignment.status !== 'CONFIRMED') {
      return next(new ErrorResponse('Order must be confirmed before marking as ready', StatusCodes.BAD_REQUEST));
    }

    await prisma.orderAssignment.update({
      where: { id: merchantAssignment.id },
      data: { status: 'READY' },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = { userId: req.user.id };

    if (status) {
      where.status = (status as string).toUpperCase();
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (notification.userId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this notification', StatusCodes.FORBIDDEN));
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { status: 'READ', readAt: new Date() },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
