import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (source === 'query') {
        const parsedQuery = (await schema.parseAsync(req.query)) as Record<string, any>;
        Object.keys(req.query).forEach((key) => delete (req.query as any)[key]);
        Object.assign(req.query, parsedQuery);
      } else if (source === 'params') {
        const parsedParams = (await schema.parseAsync(req.params)) as Record<string, any>;
        Object.keys(req.params).forEach((key) => delete (req.params as any)[key]);
        Object.assign(req.params, parsedParams);
      } else {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
