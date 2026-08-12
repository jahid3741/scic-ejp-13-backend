import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/appError.js';
import { signToken } from '../../utils/jwt.js';
import { emailService } from '../email/email.service.js';

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

export type TForgotPasswordPayload = {
  email: string;
};

export type TResetPasswordPayload = {
  token: string;
  newPassword: string;
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

const forgotPassword = async (payload: TForgotPasswordPayload) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      isDeleted: false,
    },
  });

  // Security: Do not reveal user existence
  if (!user) {
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  // Generate cryptographically secure random token (rawToken)
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Store only the SHA-256 hash in database
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Create new reset token entry
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    },
  });

  // Send email containing the rawToken
  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
  await emailService.sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
  };
};

const resetPassword = async (payload: TResetPasswordPayload) => {
  const { token, newPassword } = payload;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const resetTokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedToken,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!resetTokenRecord || !resetTokenRecord.user || resetTokenRecord.user.isDeleted) {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

  // Update user password and invalidate token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: resetTokenRecord.userId,
        used: false,
      },
      data: { used: true },
    }),
  ]);

  return {
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
};

export const authService = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
};
