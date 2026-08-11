import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { serviceService } from './service.service.js';

const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceService.createService(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === UserRole.ADMIN;
  const result = await serviceService.getAllServices(req.query, isAdmin);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services retrieved successfully',
    data: result,
  });
});

const getServiceById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const isAdmin = req.user?.role === UserRole.ADMIN;
  const result = await serviceService.getServiceById(id, isAdmin);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await serviceService.updateService(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await serviceService.softDeleteService(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service deleted successfully',
    data: null,
  });
});

export const serviceController = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};
