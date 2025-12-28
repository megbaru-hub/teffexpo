"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorResponse = void 0;
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ErrorResponse = ErrorResponse;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log to console for dev
    console.error(err);
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ErrorResponse(message, 400);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse(message.toString(), 400);
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
};
exports.errorHandler = errorHandler;
