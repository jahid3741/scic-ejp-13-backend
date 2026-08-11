import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export const signToken = (
  payload: Record<string, unknown>,
  secret: Secret = config.jwt.secret,
  expiresIn: string = config.jwt.expiresIn
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = <T extends object = Record<string, unknown>>(
  token: string,
  secret: Secret = config.jwt.secret
): T => {
  return jwt.verify(token, secret) as T;
};
