import { BookingStatus, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/appError.js';

export type TCreateReviewPayload = {
  serviceId: string;
  rating: number;
  comment?: string;
};

export type TUpdateReviewPayload = {
  rating?: number;
  comment?: string;
};

export type TGetReviewsQuery = {
  page?: string;
  limit?: string;
  serviceId?: string;
  rating?: number;
  search?: string;
  sortBy?: 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

const reviewSelectFields = {
  id: true,
  rating: true,
  comment: true,
  userId: true,
  serviceId: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const createReview = async (
  payload: TCreateReviewPayload,
  authUser: { userId: string; role: UserRole }
) => {
  // 1. Verify service exists and is not soft-deleted
  const service = await prisma.service.findFirst({
    where: {
      id: payload.serviceId,
      isDeleted: false,
    },
  });

  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  // 2. Business Rule: User can ONLY review if they have completed a booking for this service
  const completedBooking = await prisma.booking.findFirst({
    where: {
      userId: authUser.userId,
      serviceId: payload.serviceId,
      status: BookingStatus.COMPLETED,
      isDeleted: false,
    },
  });

  if (!completedBooking) {
    throw new AppError(
      403,
      'You can only review a service after completing a booking.'
    );
  }

  // 3. Duplicate Review Prevention: User cannot have multiple active reviews for same service
  const existingReview = await prisma.review.findFirst({
    where: {
      userId: authUser.userId,
      serviceId: payload.serviceId,
      isDeleted: false,
    },
  });

  if (existingReview) {
    throw new AppError(409, 'You have already reviewed this service.', [
      { path: 'serviceId', message: 'You have already reviewed this service.' },
    ]);
  }

  const newReview = await prisma.review.create({
    data: {
      userId: authUser.userId,
      serviceId: payload.serviceId,
      rating: payload.rating,
      comment: payload.comment || null,
    },
    select: reviewSelectFields,
  });

  return newReview;
};

const getAllReviews = async (query: TGetReviewsQuery) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const rawLimit = parseInt(query.limit || '10', 10);
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const skip = (page - 1) * limit;

  const whereConditions: Prisma.ReviewWhereInput[] = [{ isDeleted: false }];

  if (query.serviceId) {
    whereConditions.push({ serviceId: query.serviceId });
  }

  if (query.rating) {
    whereConditions.push({ rating: Number(query.rating) });
  }

  if (query.search && query.search.trim()) {
    whereConditions.push({
      comment: { contains: query.search.trim(), mode: 'insensitive' },
    });
  }

  const where: Prisma.ReviewWhereInput = {
    AND: whereConditions,
  };

  const allowedSortFields = ['rating', 'createdAt'];
  const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: reviewSelectFields,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getReviewById = async (id: string) => {
  const review = await prisma.review.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: reviewSelectFields,
  });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  return review;
};

const updateReview = async (
  id: string,
  payload: TUpdateReviewPayload,
  authUser: { userId: string; role: UserRole }
) => {
  const existingReview = await prisma.review.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingReview) {
    throw new AppError(404, 'Review not found');
  }

  if (authUser.role !== UserRole.ADMIN && existingReview.userId !== authUser.userId) {
    throw new AppError(403, 'Forbidden: You do not have permission to update this review');
  }

  const updateData: Prisma.ReviewUpdateInput = {};

  if (payload.rating !== undefined) updateData.rating = payload.rating;
  if (payload.comment !== undefined) updateData.comment = payload.comment.trim() || null;

  const updatedReview = await prisma.review.update({
    where: { id },
    data: updateData,
    select: reviewSelectFields,
  });

  return updatedReview;
};

const softDeleteReview = async (
  id: string,
  authUser: { userId: string; role: UserRole }
) => {
  const existingReview = await prisma.review.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingReview) {
    throw new AppError(404, 'Review not found');
  }

  if (authUser.role !== UserRole.ADMIN && existingReview.userId !== authUser.userId) {
    throw new AppError(403, 'Forbidden: You do not have permission to delete this review');
  }

  const deletedReview = await prisma.review.update({
    where: { id },
    data: { isDeleted: true },
    select: reviewSelectFields,
  });

  return deletedReview;
};

export const reviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  softDeleteReview,
};
