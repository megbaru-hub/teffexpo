import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRE: string = process.env.JWT_EXPIRE || '30d';
const JWT_COOKIE_EXPIRE: number = parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10);

// Generate JWT Token
export const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE as string | number,
  } as SignOptions);
};

// Send JWT Token in cookie
export const sendTokenResponse = (
  userId: string,
  statusCode: number,
  res: Response,
  data: any = {}
) => {
  const token = generateToken(userId);
  const options = {
    expires: new Date(
      Date.now() + JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
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
