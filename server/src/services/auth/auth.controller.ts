import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';
import { AppError } from '../../utils/appError.js';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Unauthorized access');
  }

  const result = await authService.getMe(req.user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

export const authController = {
  register,
  login,
  getMe,
};
