import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/appError.js';
import { signToken } from '../../utils/jwt.js';

export type TRegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
};

export type TLoginPayload = {
  email: string;
  password: string;
};

const registerUser = async (payload: TRegisterPayload) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(409, 'Email already registered', [
      {
        path: 'email',
        message: 'Email already registered',
      },
    ]);
  }

  const hashedPassword = await bcrypt.hash(payload.password, config.bcryptSaltRounds);

  const newPublicUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER, // Public registration MUST ALWAYS be USER
      phone: payload.phone || null,
      address: payload.address || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newPublicUser;
};

const loginUser = async (payload: TLoginPayload) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      isDeleted: false,
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  const { password, ...safeUser } = user;

  return {
    token,
    user: safeUser,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'User not found or account disabled');
  }

  return user;
};

export const authService = {
  registerUser,
  loginUser,
  getMe,
};
