import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'teffType pricePerKilo stockAvailable merchant')
      .populate('items.merchant', 'name email');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return next(new ErrorResponse('Please provide productId and quantity', StatusCodes.BAD_REQUEST));
    }

    // Get product and verify it exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', StatusCodes.NOT_FOUND));
    }

    if (product.stockAvailable < quantity) {
      return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stockAvailable < newQuantity) {
        return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        merchant: product.merchant,
        teffType: product.teffType,
        quantity: quantity,
        pricePerKilo: product.pricePerKilo
      });
    }

    await cart.save();

    await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
    await cart.populate('items.merchant', 'name email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemIndex
// @access  Private
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    const itemIndex = parseInt(req.params.itemIndex);

    if (!quantity || quantity < 0.1) {
      return next(new ErrorResponse('Please provide a valid quantity (minimum 0.1 kg)', StatusCodes.BAD_REQUEST));
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return next(new ErrorResponse('Invalid item index', StatusCodes.BAD_REQUEST));
    }

    // Verify stock availability
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return next(new ErrorResponse('Product not found', StatusCodes.NOT_FOUND));
    }

    if (product.stockAvailable < quantity) {
      return next(new ErrorResponse(`Insufficient stock. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
    await cart.populate('items.merchant', 'name email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemIndex
// @access  Private
export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemIndex = parseInt(req.params.itemIndex);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return next(new ErrorResponse('Invalid item index', StatusCodes.BAD_REQUEST));
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    await cart.populate('items.product', 'teffType pricePerKilo stockAvailable merchant');
    await cart.populate('items.merchant', 'name email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', StatusCodes.NOT_FOUND));
    }

    cart.items = [];
    await cart.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};


