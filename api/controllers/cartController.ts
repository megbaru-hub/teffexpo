import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';
import { ErrorResponse } from '../utils/errorResponse';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, teffType: true, pricePerKilo: true, stockAvailable: true, merchantId: true },
            },
            merchant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, teffType: true, pricePerKilo: true, stockAvailable: true, merchantId: true },
              },
              merchant: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return next(new ErrorResponse('Please provide productId and quantity', StatusCodes.BAD_REQUEST));
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      return next(new ErrorResponse('Product not found', StatusCodes.NOT_FOUND));
    }

    if (quantity <= 0) {
      return next(new ErrorResponse('Quantity must be greater than zero', StatusCodes.BAD_REQUEST));
    }

    if (product.stockAvailable < quantity) {
      return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stockAvailable < newQuantity) {
        return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          merchantId: product.merchantId,
          teffType: product.teffType,
          quantity,
          pricePerKilo: product.pricePerKilo,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, teffType: true, pricePerKilo: true, stockAvailable: true, merchantId: true },
            },
            merchant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    if (!quantity || quantity < 0.1) {
      return next(new ErrorResponse('Please provide a valid quantity (minimum 0.1 kg)', StatusCodes.BAD_REQUEST));
    }

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      return next(new ErrorResponse('Cart item not found', StatusCodes.NOT_FOUND));
    }

    const product = await prisma.product.findUnique({ where: { id: cartItem.productId } });
    if (!product) {
      return next(new ErrorResponse('Product not found', StatusCodes.NOT_FOUND));
    }

    if (product.stockAvailable < quantity) {
      return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, teffType: true, pricePerKilo: true, stockAvailable: true, merchantId: true },
            },
            merchant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId;

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      return next(new ErrorResponse('Cart item not found', StatusCodes.NOT_FOUND));
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, teffType: true, pricePerKilo: true, stockAvailable: true, merchantId: true },
            },
            merchant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: true },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};
