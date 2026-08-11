import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { bookingService } from './booking.service.js';
import { AppError } from '../../utils/appError.js';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const result = await bookingService.createBooking(req.body, req.user);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const result = await bookingService.getAllBookings(req.query, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  const result = await bookingService.getBookingById(id, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  const result = await bookingService.updateBooking(id, req.body, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized access');
  }

  const id = req.params.id as string;
  await bookingService.softDeleteBooking(id, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking deleted successfully',
    data: null,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
