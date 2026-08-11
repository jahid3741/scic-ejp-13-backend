import { TErrorSource } from '../types/api.types.js';

export class AppError extends Error {
  public statusCode: number;
  public errorSources?: TErrorSource[];

  constructor(statusCode: number, message: string, errorSources?: TErrorSource[], stack = '') {
    super(message);
    this.statusCode = statusCode;
    if (errorSources) {
      this.errorSources = errorSources;
    }
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
