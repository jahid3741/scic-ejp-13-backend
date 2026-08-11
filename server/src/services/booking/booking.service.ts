import { BookingStatus, UserRole, ServiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/appError.js';

export type TCreateBookingPayload = {
  serviceId: string;
  bookingDate: string;
  notes?: string;
};

export type TUpdateBookingPayload = {
  bookingDate?: string;
  notes?: string;
  status?: BookingStatus;
  serviceId?: string;
};

export type TGetBookingsQuery = {
  page?: string;
  limit?: string;
  status?: BookingStatus;
  serviceId?: string;
  sortBy?: 'bookingDate' | 'totalAmount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

const bookingSelectFields = {
  id: true,
  userId: true,
  serviceId: true,
  bookingDate: true,
  status: true,
  totalAmount: true,
  notes: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      price: true,
    },
  },
} as const;

const formatBooking = <
  T extends {
    totalAmount: Prisma.Decimal | number | string;
    service?: { price: Prisma.Decimal | number | string; [key: string]: any } | null;
  }
>(
  booking: T
) => {
  const formattedTotalAmount =
    typeof booking.totalAmount === 'object' &&
    booking.totalAmount !== null &&
    'toFixed' in booking.totalAmount
      ? (booking.totalAmount as Prisma.Decimal).toFixed(2)
      : Number(booking.totalAmount).toFixed(2);

  let formattedService = booking.service;
  if (booking.service && booking.service.price !== undefined) {
    const formattedPrice =
      typeof booking.service.price === 'object' &&
      booking.service.price !== null &&
      'toFixed' in booking.service.price
        ? (booking.service.price as Prisma.Decimal).toFixed(2)
        : Number(booking.service.price).toFixed(2);

    formattedService = {
      ...booking.service,
      price: formattedPrice,
    };
  }

  return {
    ...booking,
    totalAmount: formattedTotalAmount,
    service: formattedService,
  };
};

const validateStatusTransition = (
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  userRole: UserRole
) => {
  if (currentStatus === targetStatus) return;

  if (currentStatus === BookingStatus.COMPLETED || currentStatus === BookingStatus.CANCELLED) {
    throw new AppError(
      409,
      `Cannot change status of a ${currentStatus} booking`,
      [{ path: 'status', message: `Booking is already ${currentStatus}` }]
    );
  }

  if (currentStatus === BookingStatus.PENDING) {
    if (targetStatus === BookingStatus.CANCELLED) {
      return;
    }
    if (targetStatus === BookingStatus.CONFIRMED) {
      if (userRole !== UserRole.ADMIN) {
        throw new AppError(403, 'Only ADMIN can confirm bookings');
      }
      return;
    }
    throw new AppError(409, `Invalid status transition from PENDING to ${targetStatus}`);
  }

  if (currentStatus === BookingStatus.CONFIRMED) {
    if (userRole !== UserRole.ADMIN) {
      throw new AppError(403, 'Only ADMIN can update a CONFIRMED booking status');
    }
    if (targetStatus === BookingStatus.COMPLETED || targetStatus === BookingStatus.CANCELLED) {
      return;
    }
    throw new AppError(409, `Invalid status transition from CONFIRMED to ${targetStatus}`);
  }
};

const createBooking = async (
  payload: TCreateBookingPayload,
  authUser: { userId: string; role: UserRole }
) => {
  const service = await prisma.service.findFirst({
    where: {
      id: payload.serviceId,
      isDeleted: false,
      status: ServiceStatus.ACTIVE,
    },
  });

  if (!service) {
    throw new AppError(404, 'Service not found or unavailable');
  }

  const parsedBookingDate = new Date(payload.bookingDate);

  // Check for duplicate active booking for same user, service, and exact bookingDate
  const existingConflict = await prisma.booking.findFirst({
    where: {
      userId: authUser.userId,
      serviceId: payload.serviceId,
      bookingDate: parsedBookingDate,
      isDeleted: false,
      status: {
        not: BookingStatus.CANCELLED,
      },
    },
  });

  if (existingConflict) {
    throw new AppError(
      409,
      'You already have an active booking for this service at the exact same date and time',
      [{ path: 'bookingDate', message: 'Duplicate active booking exists' }]
    );
  }

  const newBooking = await prisma.booking.create({
    data: {
      userId: authUser.userId,
      serviceId: payload.serviceId,
      bookingDate: parsedBookingDate,
      status: BookingStatus.PENDING,
      totalAmount: service.price,
      notes: payload.notes || null,
    },
    select: bookingSelectFields,
  });

  return formatBooking(newBooking);
};

const getAllBookings = async (
  query: TGetBookingsQuery,
  authUser: { userId: string; role: UserRole }
) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const rawLimit = parseInt(query.limit || '10', 10);
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const skip = (page - 1) * limit;

  const whereConditions: Prisma.BookingWhereInput[] = [
    { isDeleted: false },
  ];

  if (authUser.role !== UserRole.ADMIN) {
    whereConditions.push({ userId: authUser.userId });
  }

  if (query.status) {
    whereConditions.push({ status: query.status });
  }

  if (query.serviceId) {
    whereConditions.push({ serviceId: query.serviceId });
  }

  const where: Prisma.BookingWhereInput = {
    AND: whereConditions,
  };

  const allowedSortFields = ['bookingDate', 'totalAmount', 'createdAt'];
  const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: bookingSelectFields,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    bookings: bookings.map(formatBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getBookingById = async (
  id: string,
  authUser: { userId: string; role: UserRole }
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: bookingSelectFields,
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (authUser.role !== UserRole.ADMIN && booking.userId !== authUser.userId) {
    throw new AppError(403, 'Forbidden: You do not have access to this booking');
  }

  return formatBooking(booking);
};

const updateBooking = async (
  id: string,
  payload: TUpdateBookingPayload,
  authUser: { userId: string; role: UserRole }
) => {
  const existingBooking = await prisma.booking.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingBooking) {
    throw new AppError(404, 'Booking not found');
  }

  if (authUser.role !== UserRole.ADMIN && existingBooking.userId !== authUser.userId) {
    throw new AppError(403, 'Forbidden: You do not have permission to update this booking');
  }

  if (payload.status !== undefined) {
    validateStatusTransition(existingBooking.status, payload.status, authUser.role);
  }

  let newTotalAmount: Prisma.Decimal | undefined = undefined;
  if (payload.serviceId !== undefined) {
    if (authUser.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only ADMIN can change the service for a booking');
    }

    const newService = await prisma.service.findFirst({
      where: {
        id: payload.serviceId,
        isDeleted: false,
        status: ServiceStatus.ACTIVE,
      },
    });

    if (!newService) {
      throw new AppError(404, 'New service not found or unavailable');
    }

    newTotalAmount = newService.price;
  }

  const updateData: Prisma.BookingUpdateInput = {};

  if (payload.bookingDate !== undefined) {
    updateData.bookingDate = new Date(payload.bookingDate);
  }
  if (payload.notes !== undefined) {
    updateData.notes = payload.notes.trim() || null;
  }
  if (payload.status !== undefined) {
    updateData.status = payload.status;
  }
  if (payload.serviceId !== undefined && authUser.role === UserRole.ADMIN) {
    updateData.service = { connect: { id: payload.serviceId } };
    if (newTotalAmount) {
      updateData.totalAmount = newTotalAmount;
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: updateData,
    select: bookingSelectFields,
  });

  return formatBooking(updatedBooking);
};

const softDeleteBooking = async (
  id: string,
  authUser: { userId: string; role: UserRole }
) => {
  const existingBooking = await prisma.booking.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingBooking) {
    throw new AppError(404, 'Booking not found');
  }

  if (authUser.role !== UserRole.ADMIN && existingBooking.userId !== authUser.userId) {
    throw new AppError(403, 'Forbidden: You do not have permission to delete this booking');
  }

  if (authUser.role !== UserRole.ADMIN) {
    if (
      existingBooking.status === BookingStatus.COMPLETED ||
      existingBooking.status === BookingStatus.CONFIRMED
    ) {
      throw new AppError(
        409,
        `Cannot delete a ${existingBooking.status} booking`
      );
    }
  }

  const deletedBooking = await prisma.booking.update({
    where: { id },
    data: { isDeleted: true },
    select: bookingSelectFields,
  });

  return formatBooking(deletedBooking);
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  softDeleteBooking,
};
