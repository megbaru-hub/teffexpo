import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Create order from cart
// @route   POST /api/v1/orders
// @access  Public (guest checkout allowed)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer, paymentProof, items } = req.body;

    // Validate customer info
    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.kebele) {
      return next(new ErrorResponse('Please provide customer name, phone, address, and kebele', StatusCodes.BAD_REQUEST));
    }

    // Get cart items from request body (for guest checkout) or from user cart
    let cartItems: any[] = [];
    
    if (items && Array.isArray(items) && items.length > 0) {
      // Guest checkout - items provided in request body
      cartItems = items;
    } else if (req.user) {
      // Authenticated user - get cart from database
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return next(new ErrorResponse('Cart is empty', StatusCodes.BAD_REQUEST));
      }
      cartItems = cart.items;
    } else {
      return next(new ErrorResponse('Cart is empty. Please provide items or login to use your cart.', StatusCodes.BAD_REQUEST));
    }

    // Validate all products and stock, and calculate totals
    const orderItems = [];
    const merchantMap = new Map();
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      // Handle both database cart items and guest cart items
      let productId: any;
      let quantity: number;

      if (cartItem.product?._id) {
        // Database cart item
        productId = cartItem.product._id;
        quantity = cartItem.quantity;
      } else {
        // Guest cart item from request body
        productId = cartItem.productId || cartItem.product;
        quantity = cartItem.quantity;
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        return next(new ErrorResponse(`Product ${productId} not found`, StatusCodes.NOT_FOUND));
      }

      if (product.stockAvailable < quantity) {
        return next(new ErrorResponse(`Insufficient stock for ${product.teffType}. Available: ${product.stockAvailable} kg`, StatusCodes.BAD_REQUEST));
      }

      // Use product price from database (not from request to prevent price manipulation)
      const finalPricePerKilo = product.pricePerKilo;
      const subtotal = quantity * finalPricePerKilo;
      totalAmount += subtotal;

      orderItems.push({
        product: product._id,
        merchant: product.merchant,
        teffType: product.teffType,
        quantity: quantity,
        pricePerKilo: finalPricePerKilo,
        subtotal: subtotal
      });

      // Group by merchant for breakdown
      const merchantIdStr = product.merchant.toString();
      if (!merchantMap.has(merchantIdStr)) {
        merchantMap.set(merchantIdStr, {
          merchant: product.merchant,
          items: [],
          amount: 0
        });
      }
      merchantMap.get(merchantIdStr).items.push({
        product: product._id,
        merchant: product.merchant,
        teffType: product.teffType,
        quantity: quantity,
        pricePerKilo: finalPricePerKilo,
        subtotal: subtotal
      });
      merchantMap.get(merchantIdStr).amount += subtotal;
    }

    // Get merchant names for breakdown
    const merchantBreakdown = [];
    for (const [merchantId, data] of merchantMap.entries()) {
      const merchant = await User.findById(merchantId);
      merchantBreakdown.push({
        merchant: data.merchant,
        merchantName: merchant?.name || 'Unknown',
        amount: data.amount,
        items: data.items
      });
    }

    // Create order
    const order = await Order.create({
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        kebele: customer.kebele,
        googleMapsLink: customer.googleMapsLink
      },
      items: orderItems,
      totalAmount: totalAmount,
      paymentStatus: paymentProof ? 'paid' : 'pending',
      paymentProof: paymentProof,
      merchantBreakdown: merchantBreakdown,
      createdBy: req.user?.id,
      orderStatus: 'pending'
    });

    // Clear cart if user is authenticated
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user.id });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    }

    await order.populate('items.merchant', 'name email');
    await order.populate('merchantBreakdown.merchant', 'name email');

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/v1/orders
// @access  Private
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await Order.find({ createdBy: req.user.id })
      .populate('items.merchant', 'name email')
      .populate('merchantBreakdown.merchant', 'name email')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.merchant', 'name email')
      .populate('merchantBreakdown.merchant', 'name email')
      .populate('assignedToMerchants.merchant', 'name email phone');

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, StatusCodes.NOT_FOUND));
    }

    // Check if user has access (created the order, is admin, or is assigned merchant)
    const isCreator = order.createdBy?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isAssignedMerchant = order.assignedToMerchants.some(
      (assignment) => assignment.merchant.toString() === req.user.id
    );

    if (!isCreator && !isAdmin && !isAssignedMerchant) {
      return next(new ErrorResponse('Not authorized to access this order', StatusCodes.FORBIDDEN));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

