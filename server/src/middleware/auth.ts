import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorResponse } from '../utils/errorResponse';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Protect routes
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Set token from cookie
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key') as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(
          new ErrorResponse('User no longer exists', 401)
        );
      }
      
      req.user = user;
      next();
    } catch (err) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }
  } catch (err) {
    return next(err);
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
