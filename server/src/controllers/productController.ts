import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Product from '../models/Product';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Get all products (with optional filters)
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchant, teffType, minPrice, maxPrice } = req.query;

    const query: any = {};

    if (merchant) {
      query.merchant = merchant;
    }

    if (teffType) {
      query.teffType = teffType;
    }

    if (minPrice || maxPrice) {
      query.pricePerKilo = {};
      if (minPrice) query.pricePerKilo.$gte = Number(minPrice);
      if (maxPrice) query.pricePerKilo.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate({
        path: 'merchant',
        select: 'name email photo',
        match: { active: { $ne: false } }
      })
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'merchant',
      select: 'name email photo',
      match: { active: { $ne: false } }
    });

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (Merchant only)
// @route   POST /api/v1/products
// @access  Private (Merchant)
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add merchant from req.user
    req.body.merchant = req.user.id;

    const product = await Product.create(req.body);

    await product.populate('merchant', 'name email');

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Merchant only)
// @route   PUT /api/v1/products/:id
// @access  Private (Merchant)
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    // Make sure user is product owner
    if (product.merchant.toString() !== req.user.id) {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, StatusCodes.FORBIDDEN));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('merchant', 'name email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Merchant only)
// @route   DELETE /api/v1/products/:id
// @access  Private (Merchant)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    // Make sure user is product owner
    if (product.merchant.toString() !== req.user.id) {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, StatusCodes.FORBIDDEN));
    }

    // Soft delete by setting active to false
    product.active = false;
    await product.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};


