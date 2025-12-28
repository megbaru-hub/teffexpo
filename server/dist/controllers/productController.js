"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const http_status_codes_1 = require("http-status-codes");
const Product_1 = __importDefault(require("../models/Product"));
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Get all products (with optional filters)
// @route   GET /api/v1/products
// @access  Public
const getProducts = async (req, res, next) => {
    try {
        const { merchant, teffType, minPrice, maxPrice } = req.query;
        const query = {};
        if (merchant) {
            query.merchant = merchant;
        }
        if (teffType) {
            query.teffType = teffType;
        }
        if (minPrice || maxPrice) {
            query.pricePerKilo = {};
            if (minPrice)
                query.pricePerKilo.$gte = Number(minPrice);
            if (maxPrice)
                query.pricePerKilo.$lte = Number(maxPrice);
        }
        const products = await Product_1.default.find(query)
            .populate('merchant', 'name email')
            .sort({ createdAt: -1 });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            count: products.length,
            data: products
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findById(req.params.id).populate('merchant', 'name email');
        if (!product) {
            return next(new errorResponse_1.ErrorResponse(`Product not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProduct = getProduct;
// @desc    Create product (Merchant only)
// @route   POST /api/v1/products
// @access  Private (Merchant)
const createProduct = async (req, res, next) => {
    try {
        // Add merchant from req.user
        req.body.merchant = req.user.id;
        const product = await Product_1.default.create(req.body);
        await product.populate('merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
// @desc    Update product (Merchant only)
// @route   PUT /api/v1/products/:id
// @access  Private (Merchant)
const updateProduct = async (req, res, next) => {
    try {
        let product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return next(new errorResponse_1.ErrorResponse(`Product not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        // Make sure user is product owner
        if (product.merchant.toString() !== req.user.id) {
            return next(new errorResponse_1.ErrorResponse(`User ${req.user.id} is not authorized to update this product`, http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        product = await Product_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('merchant', 'name email');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
// @desc    Delete product (Merchant only)
// @route   DELETE /api/v1/products/:id
// @access  Private (Merchant)
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return next(new errorResponse_1.ErrorResponse(`Product not found with id of ${req.params.id}`, http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        // Make sure user is product owner
        if (product.merchant.toString() !== req.user.id) {
            return next(new errorResponse_1.ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        // Soft delete by setting active to false
        product.active = false;
        await product.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
