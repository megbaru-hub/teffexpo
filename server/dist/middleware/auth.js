"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorResponse_1 = require("../utils/errorResponse");
const User_1 = __importDefault(require("../models/User"));
// Protect routes
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            // Set token from Bearer token in header
            token = req.headers.authorization.split(' ')[1];
        }
        // Set token from cookie
        else if (req.cookies.token) {
            token = req.cookies.token;
        }
        // Make sure token exists
        if (!token) {
            return next(new errorResponse_1.ErrorResponse('Not authorized to access this route', 401));
        }
        try {
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            const user = await User_1.default.findById(decoded.id);
            if (!user) {
                return next(new errorResponse_1.ErrorResponse('User no longer exists', 401));
            }
            req.user = user;
            next();
        }
        catch (err) {
            return next(new errorResponse_1.ErrorResponse('Not authorized to access this route', 401));
        }
    }
    catch (err) {
        return next(err);
    }
};
exports.protect = protect;
// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorResponse_1.ErrorResponse('Not authorized to access this route', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorResponse_1.ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
