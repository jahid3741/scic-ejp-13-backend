import { Response } from 'express';
import { TApiResponse } from '../types/api.types.js';

export const sendResponse = <T>(
  res: Response,
  data: {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T | null;
  }
): void => {
  const responseBody: TApiResponse<T> = {
    success: data.success,
    message: data.message,
    data: data.data !== undefined ? data.data : null,
  };

  res.status(data.statusCode).json(responseBody);
};
