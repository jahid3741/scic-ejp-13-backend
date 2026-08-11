import { ServiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/appError.js';

export type TCreateServicePayload = {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  status?: ServiceStatus;
};

export type TUpdateServicePayload = {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  categoryId?: string;
  status?: ServiceStatus;
};

export type TGetServicesQuery = {
  page?: string;
  limit?: string;
  categoryId?: string;
  status?: ServiceStatus;
  search?: string;
  sortBy?: 'price' | 'name' | 'duration' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

const serviceSelectFields = {
  id: true,
  name: true,
  description: true,
  price: true,
  duration: true,
  status: true,
  categoryId: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

// Utility to format Prisma Decimal to a consistent string "25000.00" in JSON response
const formatService = <T extends { price: Prisma.Decimal | number | string }>(service: T) => {
  return {
    ...service,
    price:
      typeof service.price === 'object' && service.price !== null && 'toFixed' in service.price
        ? (service.price as Prisma.Decimal).toFixed(2)
        : Number(service.price).toFixed(2),
  };
};

const createService = async (payload: TCreateServicePayload) => {
  // Validate that the category exists and is not soft-deleted
  const category = await prisma.category.findFirst({
    where: {
      id: payload.categoryId,
      isDeleted: false,
    },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  const newService = await prisma.service.create({
    data: {
      name: payload.name.trim(),
      description: payload.description.trim(),
      price: new Prisma.Decimal(payload.price),
      duration: payload.duration,
      categoryId: payload.categoryId,
      status: payload.status || ServiceStatus.ACTIVE,
    },
    select: serviceSelectFields,
  });

  return formatService(newService);
};

const getAllServices = async (query: TGetServicesQuery, isAdmin = false) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const rawLimit = parseInt(query.limit || '10', 10);
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const skip = (page - 1) * limit;

  const whereConditions: Prisma.ServiceWhereInput[] = [
    { isDeleted: false },
  ];

  // Public users only see ACTIVE services
  if (!isAdmin) {
    whereConditions.push({ status: ServiceStatus.ACTIVE });
  } else if (query.status) {
    whereConditions.push({ status: query.status });
  }

  if (query.categoryId) {
    whereConditions.push({ categoryId: query.categoryId });
  }

  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    whereConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.ServiceWhereInput = {
    AND: whereConditions,
  };

  const allowedSortFields = ['price', 'name', 'duration', 'createdAt'];
  const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      select: serviceSelectFields,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.service.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    services: services.map(formatService),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getServiceById = async (id: string, isAdmin = false) => {
  const where: Prisma.ServiceWhereInput = {
    id,
    isDeleted: false,
  };

  if (!isAdmin) {
    where.status = ServiceStatus.ACTIVE;
  }

  const service = await prisma.service.findFirst({
    where,
    select: serviceSelectFields,
  });

  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  return formatService(service);
};

const updateService = async (id: string, payload: TUpdateServicePayload) => {
  const existingService = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingService) {
    throw new AppError(404, 'Service not found');
  }

  if (payload.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.categoryId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }
  }

  const updateData: Prisma.ServiceUpdateInput = {};

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.description !== undefined) updateData.description = payload.description.trim();
  if (payload.price !== undefined) updateData.price = new Prisma.Decimal(payload.price);
  if (payload.duration !== undefined) updateData.duration = payload.duration;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.categoryId !== undefined) {
    updateData.category = { connect: { id: payload.categoryId } };
  }

  const updatedService = await prisma.service.update({
    where: { id },
    data: updateData,
    select: serviceSelectFields,
  });

  return formatService(updatedService);
};

const softDeleteService = async (id: string) => {
  const existingService = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingService) {
    throw new AppError(404, 'Service not found');
  }

  const deletedService = await prisma.service.update({
    where: { id },
    data: { isDeleted: true },
    select: serviceSelectFields,
  });

  return formatService(deletedService);
};

export const serviceService = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  softDeleteService,
};
