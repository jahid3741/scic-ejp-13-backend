import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { reviewService } from './review.service.js';
import { AppError } from '../../utils/appError.js';

const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const result = await reviewService.createReview(req.body, req.user);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getAllReviews(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await reviewService.getReviewById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  const result = await reviewService.updateReview(id, req.body, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  await reviewService.softDeleteReview(id, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: null,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
