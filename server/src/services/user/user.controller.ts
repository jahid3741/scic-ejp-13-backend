import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { userService } from './user.service.js';
import { AppError } from '../../utils/appError.js';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query as { page?: string; limit?: string });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  const result = await userService.getUserById(id, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  const result = await userService.updateUser(id, req.body, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await userService.softDeleteUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

export const userController = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
