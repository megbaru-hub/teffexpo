import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';
import { ErrorResponse } from '../utils/errorResponse';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer, paymentProof, items } = req.body;

    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.kebele) {
      return next(new ErrorResponse('Please provide customer name, phone, address, and kebele', StatusCodes.BAD_REQUEST));
    }

    let cartItems: any[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      cartItems = items;
    } else if (req.user) {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        return next(new ErrorResponse('Cart is empty', StatusCodes.BAD_REQUEST));
      }
      cartItems = cart.items.map(item => ({
        product: { id: item.productId, ...item.product },
        quantity: item.quantity,
        pricePerKilo: item.pricePerKilo,
      }));
    } else {
      return next(new ErrorResponse('Cart is empty. Please provide items or login to use your cart.', StatusCodes.BAD_REQUEST));
    }

    const orderItemsData: any[] = [];
    const merchantMap = new Map<string, { merchantId: string; items: any[]; amount: number }>();
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      let productId: string;
      let quantity: number;

      if (cartItem.product?.id) {
        productId = cartItem.product.id;
        quantity = cartItem.quantity;
      } else {
        productId = cartItem.productId || cartItem.product;
        quantity = cartItem.quantity;
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.active) {
        return next(new ErrorResponse(`Product ${productId} not found`, StatusCodes.NOT_FOUND));
      }

      if (quantity <= 0) {
        return next(new ErrorResponse(`Quantity must be greater than zero for ${product.teffType}`, StatusCodes.BAD_REQUEST));
      }

      if (product.stockAvailable < quantity) {
        return next(new ErrorResponse(`Insufficient stock for ${product.teffType}. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
      }

      const finalPricePerKilo = product.pricePerKilo;
      const subtotal = quantity * finalPricePerKilo;
      totalAmount += subtotal;

      orderItemsData.push({
        productId: product.id,
        merchantId: product.merchantId,
        teffType: product.teffType,
        quantity,
        pricePerKilo: finalPricePerKilo,
        subtotal,
      });

      if (!merchantMap.has(product.merchantId)) {
        merchantMap.set(product.merchantId, {
          merchantId: product.merchantId,
          items: [],
          amount: 0,
        });
      }
      const entry = merchantMap.get(product.merchantId)!;
      entry.items.push({
        productId: product.id,
        merchantId: product.merchantId,
        teffType: product.teffType,
        quantity,
        pricePerKilo: finalPricePerKilo,
        subtotal,
      });
      entry.amount += subtotal;
    }

    const merchantBreakdownData = [];
    for (const [merchantId, data] of merchantMap.entries()) {
      const merchant = await prisma.user.findUnique({ where: { id: merchantId } });
      merchantBreakdownData.push({
        merchantId: data.merchantId,
        merchantName: merchant?.name || 'Unknown',
        amount: data.amount,
      });
    }

    const order = await prisma.order.create({
      data: {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerKebele: customer.kebele,
        customerGoogleMapsLink: customer.googleMapsLink,
        totalAmount,
        paymentStatus: paymentProof ? 'PAID' : 'PENDING',
        paymentProof,
        createdById: req.user?.id,
        orderStatus: 'PENDING',
        items: {
          create: orderItemsData,
        },
        merchantBreakdown: {
          create: merchantBreakdownData.map(mb => ({
            merchantId: mb.merchantId,
            merchantName: mb.merchantName,
            amount: mb.amount,
          })),
        },
      },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (req.user) {
      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { createdById: req.user.id },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true } } } },
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

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        merchantBreakdown: { include: { merchant: { select: { id: true, name: true, email: true } } } },
        assignedToMerchants: { include: { merchant: { select: { id: true, name: true, email: true, phone: true } } } },
      },
    });

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    const isCreator = order.createdById === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const isAssignedMerchant = order.assignedToMerchants.some(
      (a) => a.merchantId === req.user.id
    );

    if (!isCreator && !isAdmin && !isAssignedMerchant) {
      return next(new ErrorResponse('Not authorized to access this order', StatusCodes.FORBIDDEN));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
