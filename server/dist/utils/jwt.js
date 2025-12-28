"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const JWT_COOKIE_EXPIRE = parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10);
// Generate JWT Token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
    });
};
exports.generateToken = generateToken;
// Send JWT Token in cookie
const sendTokenResponse = (userId, statusCode, res, data = {}) => {
    const token = (0, exports.generateToken)(userId);
    const options = {
        expires: new Date(Date.now() + JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
        success: true,
        token,
        data,
    });
};
exports.sendTokenResponse = sendTokenResponse;
