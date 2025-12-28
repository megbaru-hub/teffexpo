"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const errorResponse_1 = require("../utils/errorResponse");
// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            password,
            role: role || 'user',
        });
        (0, jwt_1.sendTokenResponse)(user._id.toString(), http_status_codes_1.StatusCodes.CREATED, res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate email & password
        if (!email || !password) {
            return next(new errorResponse_1.ErrorResponse('Please provide an email and password', http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        // Check for user
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return next(new errorResponse_1.ErrorResponse('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new errorResponse_1.ErrorResponse('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        (0, jwt_1.sendTokenResponse)(user._id.toString(), http_status_codes_1.StatusCodes.OK, res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
const logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: {},
    });
};
exports.logout = logout;
