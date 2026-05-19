import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';
import { ErrorResponse } from '../utils/errorResponse';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchant, teffType, minPrice, maxPrice } = req.query;

    const where: any = { active: true };

    if (merchant) {
      where.merchantId = merchant as string;
    }

    if (teffType) {
      where.teffType = (teffType as string).toUpperCase();
    }

    if (minPrice || maxPrice) {
      where.pricePerKilo = {};
      if (minPrice) where.pricePerKilo.gte = Number(minPrice);
      if (maxPrice) where.pricePerKilo.lte = Number(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true, email: true, photo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filteredProducts = products.filter(p => p.merchant !== null);

    res.status(StatusCodes.OK).json({
      success: true,
      count: filteredProducts.length,
      data: filteredProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        merchant: {
          select: { id: true, name: true, email: true, photo: true },
        },
      },
    });

    if (!product || !product.active) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: {
        merchantId: req.user.id,
        teffType: req.body.teffType,
        pricePerKilo: req.body.pricePerKilo,
        stockAvailable: req.body.stockAvailable || 0,
        description: req.body.description,
      },
      include: {
        merchant: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (product.merchantId !== req.user.id) {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, StatusCodes.FORBIDDEN));
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        teffType: req.body.teffType,
        pricePerKilo: req.body.pricePerKilo,
        stockAvailable: req.body.stockAvailable,
        description: req.body.description,
      },
      include: {
        merchant: {
          select: { id: true, name: true, email: true },
        },
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

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    if (product.merchantId !== req.user.id) {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, StatusCodes.FORBIDDEN));
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
