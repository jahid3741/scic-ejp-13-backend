import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { TErrorSource, TApiResponse } from '../types/api.types.js';
import { config } from '../config/index.js';

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorSources: TErrorSource[] = [
    {
      path: '',
      message: err.message || 'Internal Server Error',
    },
  ];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = err.errorSources || [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate Field Value Entered';
      const target = err.meta?.target as string[] | string | undefined;
      const pathStr = Array.isArray(target) ? target.join(', ') : target || '';
      errorSources = [
        {
          path: pathStr,
          message: `${pathStr} already exists`,
        },
      ];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = (err.meta?.cause as string) || 'Record not found';
      errorSources = [
        {
          path: '',
          message,
        },
      ];
    } else {
      message = `Database Request Error (${err.code})`;
      errorSources = [
        {
          path: '',
          message: config.env === 'development' ? err.message : 'Database request failed',
        },
      ];
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database Validation Error';
    errorSources = [
      {
        path: '',
        message: config.env === 'development' ? err.message : 'Invalid database query parameters',
      },
    ];
  } else if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as any).status === 400 &&
    'body' in err
  ) {
    statusCode = 400;
    message = 'Invalid JSON payload';
    errorSources = [
      {
        path: 'body',
        message: 'Syntax error in JSON payload',
      },
    ];
  }

  const responseBody: TApiResponse = {
    success: false,
    message,
    errorSources,
  };

  if (config.env === 'development') {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};
