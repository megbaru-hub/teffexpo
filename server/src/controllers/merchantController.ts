import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User';
import Product from '../models/Product';
import { sendTokenResponse } from '../utils/jwt';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Register merchant
// @route   POST /api/v1/auth/merchant/register
// @access  Public
export const registerMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    // Create merchant
    const merchant = await User.create({
      name,
      email,
      password,
      role: 'merchant',
    });

    sendTokenResponse(merchant._id.toString(), StatusCodes.CREATED, res, {
      id: merchant._id,
      name: merchant.name,
      email: merchant.email,
      role: merchant.role,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Login merchant
// @route   POST /api/v1/auth/merchant/login
// @access  Public
export const loginMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', StatusCodes.BAD_REQUEST));
    }

    // Check for merchant
    const merchant = await User.findOne({ email, role: 'merchant' }).select('+password');

    if (!merchant) {
      return next(new ErrorResponse('Invalid credentials or not a merchant account', StatusCodes.UNAUTHORIZED));
    }

    // Check if password matches
    const isMatch = await merchant.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', StatusCodes.UNAUTHORIZED));
    }

    sendTokenResponse(merchant._id.toString(), StatusCodes.OK, res, {
      id: merchant._id,
      name: merchant.name,
      email: merchant.email,
      role: merchant.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in merchant
// @route   GET /api/v1/auth/merchant/me
// @access  Private
export const getMerchantProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchant = await User.findById(req.user.id);
    
    if (!merchant || merchant.role !== 'merchant') {
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

// @desc    Get merchant's products
// @route   GET /api/v1/auth/merchant/products
// @access  Private (Merchant)
export const getMerchantProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ merchant: req.user.id });

    res.status(StatusCodes.OK).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
