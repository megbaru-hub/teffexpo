import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { sendTokenResponse } from '../utils/jwt';
import { ErrorResponse } from '../utils/errorResponse';

export const registerMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ErrorResponse('User already exists with this email', StatusCodes.BAD_REQUEST));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const merchant = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MERCHANT',
      },
    });

    sendTokenResponse(merchant.id, StatusCodes.CREATED, res, {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      role: merchant.role,
    });
  } catch (error: any) {
    next(error);
  }
};

export const loginMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', StatusCodes.BAD_REQUEST));
    }

    const merchant = await prisma.user.findFirst({
      where: { email, role: 'MERCHANT' },
    });

    if (!merchant || !merchant.active) {
      return next(new ErrorResponse('Invalid credentials or not a merchant account', StatusCodes.UNAUTHORIZED));
    }

    const isMatch = await bcrypt.compare(password, merchant.password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', StatusCodes.UNAUTHORIZED));
    }

    sendTokenResponse(merchant.id, StatusCodes.OK, res, {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      role: merchant.role,
    });
  } catch (error) {
    next(error);
  }
};

export const getMerchantProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchant = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!merchant || merchant.role !== 'MERCHANT') {
      return next(new ErrorResponse('Merchant not found', StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    next(error);
  }
};

export const getMerchantProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { merchantId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
