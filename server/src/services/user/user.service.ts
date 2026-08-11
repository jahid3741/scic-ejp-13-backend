import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/appError.js';

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  address: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TUpdateUserPayload = {
  name?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
};

const getAllUsers = async (query: { page?: string; limit?: string }) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, parseInt(query.limit || '10', 10));
  const skip = (page - 1) * limit;

  const where = { isDeleted: false };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectFields,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getUserById = async (
  targetId: string,
  authUser: { userId: string; role: UserRole }
) => {
  if (authUser.role !== UserRole.ADMIN && authUser.userId !== targetId) {
    throw new AppError(403, 'Forbidden: You do not have permission to view this profile');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: targetId,
      isDeleted: false,
    },
    select: userSelectFields,
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

const updateUser = async (
  targetId: string,
  payload: TUpdateUserPayload,
  authUser: { userId: string; role: UserRole }
) => {
  if (authUser.role !== UserRole.ADMIN && authUser.userId !== targetId) {
    throw new AppError(403, 'Forbidden: You do not have permission to update this profile');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      id: targetId,
      isDeleted: false,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const updateData: { name?: string; phone?: string; address?: string; role?: UserRole } = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.address !== undefined) updateData.address = payload.address;

  // Role escalation prevention: Only ADMIN can change user roles
  if (payload.role !== undefined && authUser.role === UserRole.ADMIN) {
    updateData.role = payload.role;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetId },
    data: updateData,
    select: userSelectFields,
  });

  return updatedUser;
};

const softDeleteUser = async (targetId: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: targetId,
      isDeleted: false,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const deletedUser = await prisma.user.update({
    where: { id: targetId },
    data: { isDeleted: true },
    select: userSelectFields,
  });

  return deletedUser;
};

export const userService = {
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
};
