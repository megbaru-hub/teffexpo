import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User';
import { sendTokenResponse } from '../utils/jwt';
import { ErrorResponse } from '../utils/errorResponse';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    sendTokenResponse(user._id.toString(), StatusCodes.CREATED, res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', StatusCodes.BAD_REQUEST));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', StatusCodes.UNAUTHORIZED));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', StatusCodes.UNAUTHORIZED));
    }

    sendTokenResponse(user._id.toString(), StatusCodes.OK, res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: {},
  });
};
