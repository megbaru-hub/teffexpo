"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchantProducts = exports.getMerchantProfile = exports.loginMerchant = exports.registerMerchant = void 0;
const http_status_codes_1 = require("http-status-codes");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Register merchant
// @route   POST /api/v1/auth/merchant/register
// @access  Public
const registerMerchant = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // Create merchant
        const merchant = await User_1.default.create({
            name,
            email,
            password,
            role: 'merchant',
        });
        (0, jwt_1.sendTokenResponse)(merchant._id.toString(), http_status_codes_1.StatusCodes.CREATED, res, {
            id: merchant._id,
            name: merchant.name,
            email: merchant.email,
            role: merchant.role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerMerchant = registerMerchant;
// @desc    Login merchant
// @route   POST /api/v1/auth/merchant/login
// @access  Public
const loginMerchant = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate email & password
        if (!email || !password) {
            return next(new errorResponse_1.ErrorResponse('Please provide an email and password', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Check for merchant
        const merchant = await User_1.default.findOne({ email, role: 'merchant' }).select('+password');
        if (!merchant) {
            return next(new errorResponse_1.ErrorResponse('Invalid credentials or not a merchant account', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        // Check if password matches
        const isMatch = await merchant.comparePassword(password);
        if (!isMatch) {
            return next(new errorResponse_1.ErrorResponse('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        (0, jwt_1.sendTokenResponse)(merchant._id.toString(), http_status_codes_1.StatusCodes.OK, res, {
            id: merchant._id,
            name: merchant.name,
            email: merchant.email,
            role: merchant.role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginMerchant = loginMerchant;
// @desc    Get current logged in merchant
// @route   GET /api/v1/auth/merchant/me
// @access  Private
const getMerchantProfile = async (req, res, next) => {
    try {
        const merchant = await User_1.default.findById(req.user.id);
        if (!merchant || merchant.role !== 'merchant') {
            return next(new errorResponse_1.ErrorResponse('Merchant not found', http_status_codes_1.StatusCodes.NOT_FOUND));
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: merchant,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMerchantProfile = getMerchantProfile;
// @desc    Get merchant's products
// @route   GET /api/v1/auth/merchant/products
// @access  Private (Merchant)
const getMerchantProducts = async (req, res, next) => {
    try {
        const Product = (await Promise.resolve().then(() => __importStar(require('../models/Product')))).default;
        const products = await Product.find({ merchant: req.user.id });
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
exports.getMerchantProducts = getMerchantProducts;
