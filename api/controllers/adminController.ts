import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { ErrorResponse } from '../utils/errorResponse';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'teffexpo/merchants',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
});

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, paymentStatus } = req.query;
    const where: any = {};

    if (status) {
      where.orderStatus = (status as string).toUpperCase();
    }

    if (paymentStatus) {
      where.paymentStatus = (paymentStatus as string).toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        assignedToMerchants: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const assignOrderToMerchants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantIds, notificationMethod } = req.body;

    if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
      return next(new ErrorResponse('Please provide merchant IDs array', StatusCodes.BAD_REQUEST));
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { merchantBreakdown: true, items: true },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED') {
      return next(new ErrorResponse('Cannot assign completed or cancelled order', StatusCodes.BAD_REQUEST));
    }

    const merchants = await prisma.user.findMany({
      where: { id: { in: merchantIds }, role: 'MERCHANT' },
    });

    if (merchants.length !== merchantIds.length) {
      return next(new ErrorResponse('Some merchants not found or invalid', StatusCodes.BAD_REQUEST));
    }

    const assignments: any[] = [];

    for (const merchant of merchants) {
      const hasItems = order.merchantBreakdown.some(
        (b) => b.merchantId === merchant.id
      );

      if (!hasItems) continue;

      assignments.push({
        merchantId: merchant.id,
        status: 'PENDING',
        notificationMethod: notificationMethod === 'both' ? 'dashboard' : (notificationMethod || 'dashboard'),
        phoneCalled: notificationMethod === 'phone' || notificationMethod === 'both',
        messageSent: notificationMethod === 'dashboard' || notificationMethod === 'both',
      });

      if (notificationMethod === 'dashboard' || notificationMethod === 'both') {
        const breakdown = order.merchantBreakdown.find(b => b.merchantId === merchant.id);
        await prisma.notification.create({
          data: {
            userId: merchant.id,
            type: 'ORDER_ASSIGNED',
            title: 'New Order Assigned',
            message: `You have a new order #${order.id} assigned to you. Total amount: ${breakdown?.amount || 0} ETB`,
            orderId: order.id,
            status: 'UNREAD',
          },
        });
      }
    }

    await prisma.orderAssignment.createMany({ data: assignments });

    for (const item of order.items) {
      if (!item.stockDecreased) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = Math.max(0, product.stockAvailable - item.quantity);
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockAvailable: newStock },
          });
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { stockDecreased: true },
          });
        }
      }
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        orderStatus: 'ASSIGNED',
        assignedById: req.user.id,
      },
    });

    const updated = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        assignedToMerchants: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
      message: `Order assigned to ${assignments.length} merchant(s). ${notificationMethod === 'phone' || notificationMethod === 'both' ? 'Please call them to notify.' : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

export const completeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, assignedToMerchants: true },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    for (const item of order.items) {
      if (!item.stockDecreased) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = Math.max(0, product.stockAvailable - item.quantity);
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockAvailable: newStock },
          });
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { stockDecreased: true },
          });
        }
      }
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        orderStatus: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.orderAssignment.updateMany({
      where: { orderId: req.params.id },
      data: { status: 'COMPLETED' },
    });

    for (const assignment of order.assignedToMerchants) {
      await prisma.notification.create({
        data: {
          userId: assignment.merchantId,
          type: 'ORDER_COMPLETED',
          title: 'Order Completed',
          message: `Order #${order.id} has been completed. Your payment will be processed.`,
          orderId: order.id,
          status: 'UNREAD',
        },
      });
    }

    const updated = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getMerchantBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        orderId: order.id,
        totalAmount: order.totalAmount,
        merchantBreakdown: order.merchantBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMerchants = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const merchants = await prisma.user.findMany({
      where: { role: 'MERCHANT' },
      select: { id: true, name: true, email: true, photo: true, phone: true, address: true, location: true, active: true, createdAt: true },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: merchants.length,
      data: merchants,
    });
  } catch (error) {
    next(error);
  }
};

export const registerMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, address, photo, location } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return next(new ErrorResponse('User already exists with this email', StatusCodes.BAD_REQUEST));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const merchant = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MERCHANT',
        phone,
        address,
        photo: photo || 'default.jpg',
        location,
      },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Merchant registered successfully',
      data: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        role: merchant.role,
        photo: merchant.photo,
        location: merchant.location,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, photo, location, password } = req.body;

    const merchant = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!merchant || merchant.role !== 'MERCHANT') {
      return next(new ErrorResponse('Merchant not found', StatusCodes.NOT_FOUND));
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (photo) updateData.photo = photo;
    if (location) updateData.location = location;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Merchant updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchant = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!merchant || merchant.role !== 'MERCHANT') {
      return next(new ErrorResponse('Merchant not found', StatusCodes.NOT_FOUND));
    }

    await prisma.product.deleteMany({ where: { merchantId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Merchant and their products deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMerchantPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', StatusCodes.BAD_REQUEST));
    }

    const file = req.file as any;
    res.status(StatusCodes.OK).json({
      success: true,
      data: file.path,
    });
  } catch (error) {
    next(error);
  }
};
